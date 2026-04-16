/**
 * Script to update all MAC addresses in the database to use colon format
 * Format: D0:46:0C:8B:9B:C0 (uppercase with colons)
 *
 * Run with: npx tsx prisma/fix-mac-addresses.ts
 */

import prisma from '../src/lib/prisma';

// Format MAC address to use colons (D0:46:0C:8B:9B:C0)
function formatMacAddress(mac: string): string {
  // Remove all non-hex characters
  const cleaned = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  // Insert colons every 2 characters
  const formatted = cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
  // Limit to 17 characters (XX:XX:XX:XX:XX:XX)
  return formatted.slice(0, 17);
}

async function main() {
  console.log('🔧 Starting MAC address format update...\n');

  // Fetch all assets with MAC addresses
  const assets = await prisma.asset.findMany({
    where: {
      macAddress: {
        not: null,
      },
    },
    select: {
      id: true,
      assetTag: true,
      macAddress: true,
    },
  });

  console.log(`📦 Found ${assets.length} assets with MAC addresses\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const asset of assets) {
    if (!asset.macAddress) continue;

    const formattedMac = formatMacAddress(asset.macAddress);

    // Only update if the format changed
    if (formattedMac !== asset.macAddress) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { macAddress: formattedMac },
      });

      console.log(`✅ ${asset.assetTag}: ${asset.macAddress} → ${formattedMac}`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Updated: ${updatedCount} MAC addresses`);
  console.log(`⏭️  Skipped: ${skippedCount} (already formatted)`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
