import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const settings = await db.getSettings()

    // Convert array to object for easier frontend consumption
    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: settingsObject,
    })
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ success: false, error: "Invalid settings data" }, { status: 400 })
    }

    // Update each setting
    const updatePromises = Object.entries(settings).map(([key, data]: [string, any]) => {
      return db.updateSetting(key, data.value, data.type || "string")
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
