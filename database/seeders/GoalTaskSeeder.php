<?php

namespace Database\Seeders;

use App\Models\Goal;
use App\Models\Sdg;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GoalTaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sdgSeedData = [
            [
                'sdg_name' => 'No Poverty',
                'goal' => [
                    'title' => 'Expand barangay livelihood referrals for low-income households',
                    'description' => 'Coordinate with local government and partner organizations to improve referral and onboarding of vulnerable households to livelihood and social protection programs.',
                    'start_date' => now()->subWeeks(3),
                    'end_date' => now()->addMonths(2),
                    'status' => 'in-progress',
                    'type' => 'short',
                    'compliance_percentage' => 42.50,
                ],
                'task' => [
                    'title' => 'Conduct household needs mapping and referral orientation',
                    'description' => 'Profile 50 households, verify eligibility, and facilitate orientation sessions for livelihood grant referrals with signed attendance and intake records.',
                    'status' => 'in-progress',
                    'remarks' => 'Initial mapping complete in 2 sitios; validation scheduled with the social welfare office.',
                    'deadline' => now()->addWeeks(3),
                ],
            ],
            [
                'sdg_name' => 'Zero Hunger',
                'goal' => [
                    'title' => 'Strengthen community feeding support in food-insecure schools',
                    'description' => 'Improve nutrition outcomes by supporting school-based feeding implementation, pantry coordination, and food supply monitoring for high-need learners.',
                    'start_date' => now()->subWeeks(2),
                    'end_date' => now()->addMonths(3),
                    'status' => 'in-progress',
                    'type' => 'short',
                    'compliance_percentage' => 35.00,
                ],
                'task' => [
                    'title' => 'Validate beneficiary list and weekly meal delivery logs',
                    'description' => 'Review the feeding beneficiary list with school focal persons and consolidate weekly meal distribution logs for nutrition program reporting.',
                    'status' => 'pending',
                    'remarks' => 'Waiting for two schools to submit complete attendance and meal records.',
                    'deadline' => now()->addWeeks(4),
                ],
            ],
            [
                'sdg_name' => 'Good Health and Well-being',
                'goal' => [
                    'title' => 'Increase preventive health outreach participation',
                    'description' => 'Support local health units in promoting preventive services through coordinated health caravans, risk screening, and follow-up referral tracking.',
                    'start_date' => now()->subMonth(),
                    'end_date' => now()->addMonths(4),
                    'status' => 'in-progress',
                    'type' => 'long',
                    'compliance_percentage' => 51.75,
                ],
                'task' => [
                    'title' => 'Prepare and deploy health caravan pre-registration drive',
                    'description' => 'Manage pre-registration, produce outreach materials, and coordinate with barangay health workers for blood pressure and diabetes risk screening sessions.',
                    'status' => 'in-progress',
                    'remarks' => 'Registration desk process finalized; IEC materials for two barangays pending printing.',
                    'deadline' => now()->addWeeks(2),
                ],
            ],
        ];

        foreach ($sdgSeedData as $index => $seedData) {
            $sdg = Sdg::where('name', $seedData['sdg_name'])->first();

            if (! $sdg) {
                continue;
            }

            $projectManager = User::role('project-manager')
                ->where('current_sdg_id', $sdg->id)
                ->first();

            $assignedStaff = User::role('staff')
                ->where('current_sdg_id', $sdg->id)
                ->first();

            if (! $projectManager || ! $assignedStaff) {
                continue;
            }

            $goal = Goal::create([
                'project_manager_id' => $projectManager->id,
                'sdg_id' => $sdg->id,
                'title' => $seedData['goal']['title'],
                'slug' => Str::slug($seedData['goal']['title']) . '-' . ($index + 1),
                'description' => $seedData['goal']['description'],
                'start_date' => $seedData['goal']['start_date'],
                'end_date' => $seedData['goal']['end_date'],
                'status' => $seedData['goal']['status'],
                'type' => $seedData['goal']['type'],
                'compliance_percentage' => $seedData['goal']['compliance_percentage'],
            ]);

            $goal->goalWithSdgs()->syncWithoutDetaching([$sdg->id]);
            $goal->assignedUsers()->syncWithoutDetaching([$assignedStaff->id]);

            Task::create([
                'goal_id' => $goal->id,
                'sdg_id' => $sdg->id,
                'title' => $seedData['task']['title'],
                'slug' => Str::slug($seedData['task']['title']) . '-' . ($index + 1),
                'description' => $seedData['task']['description'],
                'status' => $seedData['task']['status'],
                'remarks' => $seedData['task']['remarks'],
                'deadline' => $seedData['task']['deadline'],
            ]);
        }
    }
}