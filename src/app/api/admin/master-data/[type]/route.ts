import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  
  try {
    let data;
    switch (type) {
      case "companies":
        data = await prisma.company.findMany({ orderBy: { name: "asc" } });
        break;
      case "departments":
        data = await prisma.department.findMany({ orderBy: { name: "asc" } });
        break;
      case "designations":
        data = await prisma.designation.findMany({ orderBy: { name: "asc" } });
        break;
      case "locations":
        data = await prisma.location.findMany({ orderBy: { name: "asc" } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { type } = await params;
  const body = await request.json();

  try {
    let result;
    switch (type) {
      case "companies":
        result = await prisma.company.create({ data: { name: body.name, code: body.code } });
        break;
      case "departments":
        result = await prisma.department.create({ data: { name: body.name } });
        break;
      case "designations":
        result = await prisma.designation.create({ data: { name: body.name } });
        break;
      case "locations":
        result = await prisma.location.create({ data: { name: body.name, address: body.address } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { type } = await params;
  const body = await request.json();
  const { id, ...data } = body;

  try {
    let result;
    switch (type) {
      case "companies":
        result = await prisma.company.update({ where: { id }, data });
        break;
      case "departments":
        result = await prisma.department.update({ where: { id }, data });
        break;
      case "designations":
        result = await prisma.designation.update({ where: { id }, data });
        break;
      case "locations":
        result = await prisma.location.update({ where: { id }, data });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    switch (type) {
      case "companies":
        await prisma.company.delete({ where: { id } });
        break;
      case "departments":
        await prisma.department.delete({ where: { id } });
        break;
      case "designations":
        await prisma.designation.delete({ where: { id } });
        break;
      case "locations":
        await prisma.location.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed. Record might be in use." }, { status: 500 });
  }
}
