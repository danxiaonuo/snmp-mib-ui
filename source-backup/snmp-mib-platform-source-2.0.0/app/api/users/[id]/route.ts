import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const userId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const [updatedUser] = await db.updateUser(userId, body)

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    await db.updateUser(userId, { is_active: false })

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
    })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
