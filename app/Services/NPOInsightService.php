<?php

namespace App\Services;

use App\Models\AIInsight;
use App\Models\Goal;
use App\Models\Task;
use App\Models\TaskProductivity;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class NPOInsightService
{
    public function getGoalInsights(): array
    {
        return Cache::remember('npo_insights_goals_' . now()->format('Y-m-d'), 3600, function () {
            $goals = Goal::with(['tasks', 'assignedUsers', 'goalWithSdgs'])->get();

            if ($goals->isEmpty()) {
                return ['recommendations' => [], 'anomalies' => [], 'summary' => []];
            }

            return [
                'summary'         => $this->buildGoalSummary($goals),
                'recommendations' => $this->generateGoalRecommendations($goals),
                'anomalies'       => $this->detectGoalAnomalies($goals),
            ];
        });
    }

    public function getTaskInsights(): array
    {
        return Cache::remember('npo_insights_tasks_' . now()->format('Y-m-d'), 3600, function () {
            $tasks = Task::with(['goal', 'taskProductivities', 'user'])->get();

            if ($tasks->isEmpty()) {
                return ['recommendations' => [], 'anomalies' => []];
            }

            return [
                'recommendations' => $this->generateTaskRecommendations($tasks),
                'anomalies'       => $this->detectOverdueTasks($tasks),
            ];
        });
    }

    // --- Goal Analysis ---

    private function buildGoalSummary($goals): array
    {
        $total      = $goals->count();
        $completed  = $goals->where('status', 'completed')->count();
        $inProgress = $goals->where('status', 'in-progress')->count();
        $pending    = $goals->where('status', 'pending')->count();
        $overdue    = $goals->filter(fn($g) => $g->end_date < now() && $g->status !== 'completed')->count();
        $avgCompliance = round($goals->avg('compliance_percentage'), 2);

        return compact('total', 'completed', 'inProgress', 'pending', 'overdue', 'avgCompliance');
    }

    private function generateGoalRecommendations($goals): array
    {
        $recommendations = [];
        $total      = $goals->count();
        $completed  = $goals->where('status', 'completed')->count();
        $overdue    = $goals->filter(fn($g) => $g->end_date < now() && $g->status !== 'completed')->count();
        $avgCompliance = $goals->avg('compliance_percentage');

        $completionRate = $total > 0 ? round(($completed / $total) * 100) : 0;
        $recommendations[] = [
            'type'        => 'opportunity',
            'title'       => 'Goal Completion Overview',
            'description' => "{$completed} of {$total} goals completed ({$completionRate}%). Average compliance: {$avgCompliance}%.",
            'impact'      => 'medium',
            'actionable'  => false,
        ];

        if ($overdue > 0) {
            $recommendations[] = [
                'type'        => 'risk',
                'title'       => 'Overdue Goals Detected',
                'description' => "{$overdue} goal(s) have passed their end date without completion. Review and update timelines or resources.",
                'impact'      => 'high',
                'actionable'  => true,
            ];
        }

        if ($avgCompliance < 50) {
            $recommendations[] = [
                'type'        => 'risk',
                'title'       => 'Low Overall Compliance',
                'description' => "Average goal compliance is " . round($avgCompliance) . "%. Consider breaking long-term goals into smaller milestones.",
                'impact'      => 'high',
                'actionable'  => true,
            ];
        } elseif ($avgCompliance < 75) {
            $recommendations[] = [
                'type'        => 'productivity',
                'title'       => 'Moderate Compliance Rate',
                'description' => "Average compliance at " . round($avgCompliance) . "%. Identify blockers in in-progress goals.",
                'impact'      => 'medium',
                'actionable'  => true,
            ];
        }

        $goalsWithoutTasks = $goals->filter(fn($g) => $g->tasks->isEmpty())->count();
        if ($goalsWithoutTasks > 0) {
            $recommendations[] = [
                'type'        => 'opportunity',
                'title'       => 'Goals Without Tasks',
                'description' => "{$goalsWithoutTasks} goal(s) have no tasks assigned. Break them down into actionable tasks to track progress.",
                'impact'      => 'medium',
                'actionable'  => true,
            ];
        }

        return $recommendations;
    }

    private function detectGoalAnomalies($goals): array
    {
        $anomalies = [];

        foreach ($goals as $goal) {
            if ($goal->end_date < now() && $goal->status !== 'completed') {
                $daysOverdue = now()->diffInDays($goal->end_date);
                $anomalies[] = [
                    'type'        => 'overdue_goal',
                    'title'       => "Overdue Goal: {$goal->title}",
                    'description' => "Goal is {$daysOverdue} days past its end date with status '{$goal->status}'.",
                    'severity'    => $daysOverdue > 30 ? 'high' : 'medium',
                    'actionable'  => true,
                ];
            }

            if ($goal->status === 'in-progress' && $goal->compliance_percentage == 0) {
                $anomalies[] = [
                    'type'        => 'stalled_goal',
                    'title'       => "Stalled Goal: {$goal->title}",
                    'description' => "Goal is marked in-progress but has 0% compliance. No productive activity recorded.",
                    'severity'    => 'medium',
                    'actionable'  => true,
                ];
            }
        }

        return $anomalies;
    }

    // --- Task Analysis ---

    private function generateTaskRecommendations($tasks): array
    {
        $recommendations = [];
        $total      = $tasks->count();
        $completed  = $tasks->where('status', 'completed')->count();
        $overdue    = $tasks->filter(fn($t) => $t->deadline < now() && $t->status !== 'completed')->count();
        $pending    = $tasks->where('status', 'pending')->count();

        $completionRate = $total > 0 ? round(($completed / $total) * 100) : 0;

        $recommendations[] = [
            'type'        => 'opportunity',
            'title'       => 'Task Completion Overview',
            'description' => "{$completed} of {$total} tasks completed ({$completionRate}%). {$overdue} overdue, {$pending} still pending.",
            'impact'      => 'medium',
            'actionable'  => false,
        ];

        if ($overdue > 0) {
            $recommendations[] = [
                'type'        => 'risk',
                'title'       => 'Overdue Tasks Need Attention',
                'description' => "{$overdue} task(s) have missed their deadline. Reassign or reschedule to unblock goal progress.",
                'impact'      => 'high',
                'actionable'  => true,
            ];
        }

        $tasksWithNoSubmissions = $tasks->filter(fn($t) => $t->taskProductivities->isEmpty())->count();
        if ($tasksWithNoSubmissions > 0) {
            $recommendations[] = [
                'type'        => 'productivity',
                'title'       => 'Tasks With No Activity',
                'description' => "{$tasksWithNoSubmissions} task(s) have no productivity submissions. Follow up with assigned staff.",
                'impact'      => 'medium',
                'actionable'  => true,
            ];
        }

        return $recommendations;
    }

    private function detectOverdueTasks($tasks): array
    {
        $anomalies = [];
        $overdueTasks = $tasks->filter(fn($t) => $t->deadline < now() && $t->status !== 'completed');

        foreach ($overdueTasks as $task) {
            $daysOverdue = now()->diffInDays($task->deadline);
            $anomalies[] = [
                'type'        => 'overdue_task',
                'title'       => "Overdue: {$task->title}",
                'description' => "Task is {$daysOverdue} days overdue. Goal: {$task->goal->title}.",
                'severity'    => $daysOverdue > 14 ? 'high' : 'medium',
                'actionable'  => true,
            ];
        }

        return $anomalies;
    }

    // --- Store to DB (FIXED) ---

    public function generateAndStoreAllInsights(): array
    {
        $result = [];

        // Process Goal Insights
        $goalData = $this->getGoalInsights();
        $this->storeInsights($goalData, 'goal');
        $result['goals'] = $goalData;

        // Process Task Insights
        $taskData = $this->getTaskInsights();
        $this->storeInsights($taskData, 'task');
        $result['tasks'] = $taskData;

        // Generate Executive Summary
        $this->generateExecutiveSummary();

        return $result;
    }

    /**
     * Store insights to database - FIXED to handle NPO data structure
     */
    public function storeInsights(array $data, string $type): void
    {
        $allInsights = [];

        // Handle recommendations
        if (isset($data['recommendations']) && is_array($data['recommendations'])) {
            foreach ($data['recommendations'] as $rec) {
                $allInsights[] = [
                    'type'        => $type,
                    'title'       => $rec['title'] ?? ucfirst($type) . ' Recommendation',
                    'description' => $rec['description'] ?? '',
                    'impact'      => $rec['impact'] ?? 'medium',
                    'actionable'  => $rec['actionable'] ?? true,
                    'metadata'    => ['source' => $type . '_recommendation'],
                ];
            }
        }

        // Handle anomalies
        if (isset($data['anomalies']) && is_array($data['anomalies'])) {
            foreach ($data['anomalies'] as $anomaly) {
                $allInsights[] = [
                    'type'        => 'anomaly',
                    'title'       => $anomaly['title'] ?? 'Anomaly Detected',
                    'description' => $anomaly['description'] ?? '',
                    'impact'      => $anomaly['severity'] ?? $anomaly['impact'] ?? 'high',
                    'actionable'  => $anomaly['actionable'] ?? true,
                    'metadata'    => $anomaly,
                ];
            }
        }

        // Store each insight
        foreach ($allInsights as $insight) {
            try {
                AIInsight::updateOrCreate(
                    [
                        'type'        => $insight['type'],
                        'title'       => $insight['title'],
                        'analyzed_at' => now()->startOfDay(),
                    ],
                    [
                        'description' => $insight['description'],
                        'impact'      => $insight['impact'],
                        'actionable'  => $insight['actionable'],
                        'metadata'    => $insight['metadata'] ?? [],
                        'analyzed_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                Log::error('Failed to store insight: ' . $e->getMessage(), ['insight' => $insight]);
            }
        }

        Log::info('Stored ' . count($allInsights) . ' insights for type: ' . $type);
    }

    /**
     * Generate executive summary from all insights
     */
    private function generateExecutiveSummary(): void
    {
        try {
            $goalCount = AIInsight::ofType('goal')->count();
            $taskCount = AIInsight::ofType('task')->count();
            $anomalyCount = AIInsight::ofType('anomaly')->count();
            
            $highImpactCount = AIInsight::where('impact', 'high')->count();
            $actionableCount = AIInsight::where('actionable', true)->count();

            $summary = sprintf(
                "Analysis complete. Currently tracking %d goal insights, %d task insights, and %d anomalies. " .
                "There are %d high-impact items requiring attention, with %d actionable recommendations ready for implementation.",
                $goalCount, $taskCount, $anomalyCount, $highImpactCount, $actionableCount
            );

            AIInsight::updateOrCreate(
                ['type' => 'summary', 'analyzed_at' => now()->startOfDay()],
                [
                    'title' => 'Executive Summary',
                    'description' => $summary,
                    'impact' => 'high',
                    'actionable' => false,
                    'analyzed_at' => now(),
                ]
            );
        } catch (\Exception $e) {
            Log::error('Failed to generate executive summary: ' . $e->getMessage());
        }
    }
}