<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // [email, name, role-key matching edu/shell.jsx ROLES, human label]
        $officers = [
            ['admin@prs.test',       'Super Admin',         'super-admin',           'Super Admin'],
            ['marisa@prs.test',      'Marisa Borg',         'prs-office',            'PRS Office'],
            ['karl@prs.test',        'Karl Mifsud',         'recruitment',           'Recruitment'],
            ['roberta@prs.test',     'Roberta Camilleri',   'salaries',              'Salaries / Increments'],
            ['janet@prs.test',       'Janet Sciberras',     'leaves',                'Leaves'],
            ['francesca@prs.test',   'Francesca Mizzi',     'conf-appointment',      'Confirmation of Appointment'],
            ['alex@prs.test',        'Alex Buhagiar',       'discipline-hr',         'Discipline & HR Plan'],
            ['pauline@prs.test',     'Pauline Vella',       'health-safety',         'Health & Safety'],
            ['thomas@prs.test',      'Thomas Spiteri',      'forms-docs',            'Forms & Documents'],
            ['carmen@prs.test',      'Carmen Spiteri',      'terminations',          'Terminations'],
            ['joseph@prs.test',      'Joseph Schembri',     'transfers-promotions',  'Transfers & Promotions'],
            ['george@prs.test',      'George Farrugia',     'progressions',          'Progressions'],
            ['maria@prs.test',       'Maria Caruana',       'paypoints',             'Pay Points'],
        ];

        foreach ($officers as [$email, $name, $role, $_label]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'role' => $role,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command->info('Seeded '.count($officers).' demo users (password: "password").');
        foreach ($officers as [$email, $name, $_role, $label]) {
            $this->command->line("  · {$email}  → {$name} ({$label})");
        }
    }
}
