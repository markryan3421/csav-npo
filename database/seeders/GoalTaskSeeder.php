<?php

namespace Database\Seeders;

use App\Models\Sdg;
use App\Models\Goal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class GoalTaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all staff and project managers
        $staffMembers = User::role('staff')->get();
        $projectManagers = User::role('project-manager')->pluck('id')->toArray();

        // Get all SDG IDs
        $sdgIds = Sdg::pluck('id')->toArray();

        foreach ($staffMembers as $member) {
            // Assign each staff 2 goals
            $goals = Goal::factory(2)->create([
                'project_manager_id' => collect($projectManagers)->random(), // pick a random manager
                'sdg_id' => collect($sdgIds)->random(),                      // pick a random SDG
            ]);

            // foreach ($goals as $goal) {
            //     // Attach staff to pivot table goal_user
            //     $goal->users()->attach($member->id);

            //     // Create 3 tasks under this goal
            //     Task::factory(3)->create([
            //         'goal_id' => $goal->id,
            //     ]);
            // }
        }
    }
}
