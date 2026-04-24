import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Type mapping helpers
    const typeMap: Record<string, string> = {
      'monitor': 'monitor',
      'keyboard': 'keyboard',
      'mouse': 'mouse',
      'webcam': 'webcam',
      'headset': 'headset',
      'docking_station': 'docking_station',
      'docking station': 'docking_station',
    };

    const conditionMap: Record<string, string> = {
      'excellent': 'excellent',
      'good': 'good',
      'fair': 'fair',
    };

    const results = await prisma.$transaction(async (tx) => {
      const createdItems = [];
      
      for (const item of items) {
        // Resolve Employee ID if employeeCode is provided
        let resolvedEmployeeId = null;
        if (item.employeeCode) {
          const emp = await tx.employee.findUnique({
            where: { employeeCode: item.employeeCode.toString() },
            select: { id: true }
          });
          resolvedEmployeeId = emp?.id || null;
        }

        const accessory = await tx.accessory.create({
          data: {
            assetTag: item.assetTag.toString().trim(),
            type: (typeMap[item.type?.toLowerCase()] || 'other') as any,
            make: item.make || null,
            model: item.model || null,
            serialNumber: item.serialNumber?.toString().trim() || null,
            status: resolvedEmployeeId ? 'assigned' : 'available',
            condition: (conditionMap[item.condition?.toLowerCase()] || 'good') as any,
            currentEmployeeId: resolvedEmployeeId,
            notes: item.notes || null,
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
            warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry) : null,
          }
        });
        createdItems.push(accessory);
      }
      return createdItems;
    });

    return NextResponse.json({ 
      success: true, 
      count: results.length 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Failed to import accessories', 
      details: (error as any).message 
    }, { status: 500 });
  }
}
