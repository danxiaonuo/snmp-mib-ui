import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const users = await db.getUsers()
    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, role } = body

    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    const [newUser] = await db.createUser({
      email,
      name,
      password_hash,
      role: role || "user",
    })

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "User created successfully",
    })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
  }
}
