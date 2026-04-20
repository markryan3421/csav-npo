<?php

namespace Database\Seeders;

use App\Models\Goal;
use App\Models\Sdg;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GoalTaskSeeder extends Seeder
{
	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		// Assuming you have at least one user to act as project manager
		$projectManager = User::first();

		if (!$projectManager) {
			$this->command->error('No users found. Please seed users first.');
			return;
		}

		// Get the first SDG available
		$sdg = Sdg::first();

		if (!$sdg) {
			$this->command->error('No SDG found. Please seed SDGs first.');
			return;
		}

		$this->command->info("Using SDG: {$sdg->name} (ID: {$sdg->id})");

		$goalsData = [
			[
				'title' => 'Curriculum Standardization and Quality Control',
				'description' => 'To ensure the BSOA curriculum is industry-relevant, updated, and compliant with national education standards.',
				'type' => 'long term',
				'tasks' => [
					'Curriculum Mapping: Aligning course outcomes with program objectives and industry needs.',
					'Syllabus Review: Annual auditing of all BSOA syllabi to ensure modern office technologies are included.',
					'Stakeholder Consultation: Gathering feedback from alumni and partner industries.',
				],
			],
			[
				'title' => 'Faculty Competency and Development',
				'description' => 'To guarantee that BSOA instructors possess the necessary academic qualifications and industry certifications.',
				'type' => 'long term',
				'tasks' => [
					'Faculty Training Needs Analysis (TNA): Identifying gaps in faculty knowledge (e.g., new ERP software or virtual assistant tools).',
					'Credential Verification: Ensuring all faculty have the required Master\'s degrees or National Certificates (NC).',
					'Performance Evaluation: Regular classroom observations and student feedback loops.',
				],
			],
			[
				'title' => 'Enhancement of Laboratory and Learning Resources',
				'description' => 'To provide students with a physical or virtual environment that simulates a professional office setting.',
				'type' => 'long term',
				'tasks' => [
					'Inventory Management: Maintaining a log of functioning computers, typewriters (if applicable), and office equipment.',
					'Maintenance Scheduling: Routine updates for office software and hardware repairs.',
					'Safety Audit: Ensuring the laboratory complies with health and safety standards.',
				],
			],
			[
				'title' => 'Internship and Placement Monitoring',
				'description' => 'To manage the transition of students from the classroom to the professional workforce effectively.',
				'type' => 'long term',
				'tasks' => [
					'MOA Management: Establishing and renewing Memorandums of Agreement with reputable host training agencies.',
					'Internship Monitoring: Regular visits or check-ins with supervisors at the companies where BSOA students are interning.',
					'Traceability of Graduates: Tracking employment rates of BSOA alumni.',
				],
			],
			[
				'title' => 'Document Control and Records Management',
				'description' => 'To demonstrate "Good Housekeeping" by maintaining a systematic filing system for all departmental records.',
				'type' => 'short term',
				'tasks' => [
					'Master List of Documents: Creating a registry for all internal forms and procedures.',
					'Archive Management: Properly disposing of or archiving old student records according to data privacy laws.',
				],
			],
		];

		$now = now();

		foreach ($goalsData as $goalData) {
			// Create the goal (without sdg_id since it's in the pivot)
			$goal = Goal::create([
				'project_manager_id' => $projectManager->id,
				'title' => $goalData['title'],
				'slug' => Str::slug($goalData['title'] . '-' . Str::random(6)),
				'description' => $goalData['description'],
				'start_date' => $now->copy()->addDays(rand(1, 10)),
				'end_date' => $now->copy()->addMonths(rand(6, 18)),
				'status' => 'pending',
				'type' => $goalData['type'],
				'compliance_percentage' => 0,
			]);

			// Attach the SDG using the pivot table
			$goal->sdgs()->attach($sdg->id);

			$this->command->info("Created goal: {$goalData['title']}");

			// Create tasks for the goal (tasks still have direct sdg_id foreign key)
			foreach ($goalData['tasks'] as $taskTitle) {
				Task::create([
					'goal_id' => $goal->id,
					'sdg_id' => $sdg->id,  // Tasks still have direct SDG foreign key
					'title' => $taskTitle,
					'slug' => Str::slug($taskTitle . '-' . Str::random(6)),
					'description' => null,
					'status' => 'pending',
					'remarks' => null,
					'deadline' => $now->copy()->addMonths(rand(1, 6)),
				]);
			}

			$this->command->info("  - Created " . count($goalData['tasks']) . " tasks");
		}

		$this->command->newLine();
		$this->command->info('✓ Goals and tasks seeded successfully!');
		$this->command->info("✓ All goals attached to SDG ID: {$sdg->id}");
	}
}
