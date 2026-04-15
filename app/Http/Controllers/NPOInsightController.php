<?php

namespace App\Http\Controllers;

use App\Models\AIInsight;
use App\Services\NPOInsightService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NPOInsightController extends Controller
{
    public function __construct(protected NPOInsightService $service) {}

    public function dashboard()
    {
        return Inertia::render('AI/dashboard', [
            'goalInsights'    => AIInsight::ofType('goal')->latest('analyzed_at')->limit(5)->get(),
            'taskInsights'    => AIInsight::ofType('task')->latest('analyzed_at')->limit(5)->get(),
            'anomalies'       => AIInsight::ofType('anomaly')->latest('analyzed_at')->limit(10)->get(),
            'latestSummary'   => AIInsight::where('type', 'summary')->latest('analyzed_at')->value('description')
                                 ?? 'No summary yet. Click Generate Insights.',
            'lastAnalyzed'    => AIInsight::latest('analyzed_at')->first()?->analyzed_at?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    public function generateInsights(Request $request)
    {
        try {
            $type = $request->get('type', 'all');
            
            if ($type === 'all') {
                $result = $this->service->generateAndStoreAllInsights();
                return response()->json([
                    'success' => true,
                    'message' => 'All insights generated successfully',
                    'generated' => $result
                ]);
            }
            
            if ($type === 'goals') {
                $goalData = $this->service->getGoalInsights();
                $this->service->storeInsights($goalData, 'goal');
                return response()->json([
                    'success' => true,
                    'message' => 'Goal insights generated successfully',
                ]);
            }
            
            if ($type === 'tasks') {
                $taskData = $this->service->getTaskInsights();
                $this->service->storeInsights($taskData, 'task');
                return response()->json([
                    'success' => true,
                    'message' => 'Task insights generated successfully',
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Invalid type specified',
            ], 400);
            
        } catch (\Exception $e) {
            Log::error('Insight generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate insights: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getInsights(Request $request)
    {
        $type = $request->get('type', 'all');

        return response()->json([
            'goalInsights'  => AIInsight::ofType('goal')->latest('analyzed_at')->limit(10)->get(),
            'taskInsights'  => AIInsight::ofType('task')->latest('analyzed_at')->limit(10)->get(),
            'anomalies'     => AIInsight::ofType('anomaly')->latest('analyzed_at')->limit(20)->get(),
            'summary'       => AIInsight::where('type', 'summary')->latest('analyzed_at')->value('description') ?? 'No summary available',
        ]);
    }
}