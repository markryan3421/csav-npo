<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Pagination\LengthAwarePaginator;

class LogController extends Controller
{
    public function index()
    {
        $logFiles = $this->getLogFiles();
        $selectedFile = request('file', 'laravel.log');
        $logs = $this->parseLogFile($selectedFile);

        // Paginate results
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $perPage = 50;
        $currentItems = array_slice($logs, ($currentPage - 1) * $perPage, $perPage);
        $logs = new LengthAwarePaginator($currentItems, count($logs), $perPage, $currentPage, [
            'path' => LengthAwarePaginator::resolveCurrentPath(),
            'query' => request()->query(),
        ]);

        return inertia('Logs/Index', compact('logFiles', 'logs', 'selectedFile'));
    }

    private function getLogFiles(): array
    {
        $logPath = storage_path('logs');
        $files = File::files($logPath);

        return collect($files)
            ->filter(fn($file) => $file->getExtension() === 'log')
            ->map(fn($file) => [
                'name' => $file->getFilename(),
                'size' => $this->formatBytes($file->getSize()),
                'modified' => $file->getMTime(),
                'path' => $file->getPathname(),
            ])
            ->sortByDesc('modified')
            ->values()
            ->toArray();
    }

    private function parseLogFile(string $filename): array
    {
        $path = storage_path("logs/{$filename}");
        if (!File::exists($path)) return [];

        $content = File::get($path);
        $pattern = '/\[(?<date>.*?)\]\s+(?<env>\w+)\.(?<level>\w+):\s+(?<message>.*?)(?=\n\[\d{4}-\d{2}-\d{2}|$)/s';

        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

        return array_map(function ($match) {
            return [
                'timestamp' => $match['date'],
                'environment' => $match['env'],
                'level' => strtolower($match['level']),
                'message' => trim($match['message']),
            ];
        }, $matches);
    }

    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
