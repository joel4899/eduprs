<?php

namespace App\Providers;

use AzureOss\Storage\Blob\BlobServiceClient;
use AzureOss\Storage\BlobFlysystem\AzureBlobStorageAdapter;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;

class AzureBlobServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Storage::extend('azure', function ($app, array $config) {
            $connection = $config['connection_string']
                ?? $this->buildConnectionString($config);

            if (empty($connection)) {
                throw new \RuntimeException(
                    'Azure Blob disk requires AZURE_STORAGE_CONNECTION_STRING or '
                    .'(AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_KEY) to be configured.'
                );
            }

            $service = BlobServiceClient::fromConnectionString($connection);
            $container = $service->getContainerClient($config['container']);

            $adapter = new AzureBlobStorageAdapter(
                $container,
                $config['prefix'] ?? ''
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }

    /**
     * @param  array<string, string|null>  $config
     */
    private function buildConnectionString(array $config): ?string
    {
        $account = $config['account_name'] ?? null;
        $key = $config['account_key'] ?? null;
        $endpoint = $config['endpoint'] ?? null;

        if (! $account || ! $key) {
            return null;
        }

        $parts = [
            'DefaultEndpointsProtocol=https',
            "AccountName={$account}",
            "AccountKey={$key}",
        ];

        if ($endpoint) {
            $parts[] = "BlobEndpoint={$endpoint}";
        } else {
            $parts[] = 'EndpointSuffix=core.windows.net';
        }

        return implode(';', $parts);
    }
}
