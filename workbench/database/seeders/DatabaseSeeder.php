<?php

declare(strict_types=1);

namespace Workbench\Database\Seeders;

use Illuminate\Database\Seeder;
use Workbench\App\Models\Customer;
use Workbench\App\Models\Order;
use Workbench\App\Models\Product;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $cities = ['Casablanca', 'Rabat', 'Paris', 'Lyon', 'Dubai', 'Riyadh'];
        $names = ['Amina Haddad', 'Youssef Benali', 'Claire Martin', 'Omar Farouk', 'Sara El Idrissi', 'Hugo Bernard', 'Layla Nasser', 'Karim Tazi', 'Inès Moreau', 'Nadia Chraibi', 'Lucas Petit', 'Salma Alaoui'];

        foreach (range(1, 24) as $index) {
            $name = $names[($index - 1) % count($names)].($index > count($names) ? ' II' : '');

            $customer = Customer::query()->create([
                'name' => $name,
                'email' => 'customer'.$index.'@example.com',
                'city' => $cities[$index % count($cities)],
                'is_vip' => $index % 4 === 0,
            ]);

            Order::query()->create([
                'customer_id' => $customer->getKey(),
                'number' => sprintf('ORD-%04d', 1000 + $index),
                'total' => 1500 + $index * 275,
            ]);
        }

        foreach (['Desk lamp', 'Notebook', 'Fountain pen', 'Backpack', 'Headphones'] as $index => $product) {
            Product::query()->create(['name' => $product, 'sku' => sprintf('SKU-%03d', $index + 1), 'price' => 990 + $index * 450]);
        }
    }
}
