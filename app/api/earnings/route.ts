import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { EarningFormData } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Parse request body
    const body: EarningFormData = await request.json();

    // Validate required fields
    if (!body.user_id || !body.game_id || !body.amount_farmed) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, game_id, amount_farmed" },
        { status: 400 }
      );
    }

    // Validate amounts are positive
    if (body.amount_farmed <= 0 || body.net_income < 0) {
      return NextResponse.json(
        { error: "Amounts must be positive numbers" },
        { status: 400 }
      );
    }

    // Insert into database with approved status
    const { data, error } = await supabase
      .from("earnings")
      .insert({
        user_id: body.user_id,
        game_id: body.game_id,
        amount_farmed: body.amount_farmed,
        applied_rate: body.applied_rate,
        net_income: body.net_income,
        status: "approved",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating earning:", error);
      return NextResponse.json(
        { error: "Failed to create earning record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}