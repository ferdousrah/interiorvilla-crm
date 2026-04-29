<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New lead assigned</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; color: #1f2937; }
        .wrap { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .pill { display: inline-block; padding: 4px 10px; background: #eef5eb; color: #1f7a39; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 14px 0 6px; }
        .sub { font-size: 14px; color: #4b5563; margin: 0 0 24px; line-height: 1.55; }
        .lead-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px; }
        .lead-card .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
        .lead-card .row:last-child { border-bottom: 0; }
        .lead-card .label { color: #6b7280; }
        .lead-card .value { color: #111827; font-weight: 600; text-align: right; max-width: 60%; }
        .btn { display: inline-block; padding: 12px 22px; background: #4f46e5; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <span class="pill">New Assignment</span>
            <h1 class="h1">Hi {{ $assignee->name }},</h1>
            <p class="sub">
                @if($assignedBy)
                    <strong>{{ $assignedBy->name }}</strong> has assigned a new lead to you.
                @else
                    A new lead has been assigned to you.
                @endif
                Please follow up at your earliest convenience.
            </p>

            <div class="lead-card">
                <div class="row">
                    <span class="label">Name</span>
                    <span class="value">
                        @if($lead->type === 'corporate' && !empty($lead->company_name))
                            {{ $lead->company_name }}<br>
                            <span style="font-weight: 400; color: #6b7280; font-size: 12px;">Attn: {{ $lead->name }}</span>
                        @else
                            {{ $lead->name }}
                        @endif
                    </span>
                </div>
                <div class="row">
                    <span class="label">Phone</span>
                    <span class="value">{{ $lead->phone ?: '—' }}</span>
                </div>
                @if($lead->email)
                    <div class="row">
                        <span class="label">Email</span>
                        <span class="value">{{ $lead->email }}</span>
                    </div>
                @endif
                @if($lead->source)
                    <div class="row">
                        <span class="label">Source</span>
                        <span class="value" style="text-transform: capitalize;">{{ str_replace('_', ' ', $lead->source) }}</span>
                    </div>
                @endif
                @if($lead->service_type)
                    <div class="row">
                        <span class="label">Service</span>
                        <span class="value">{{ $lead->service_type }}</span>
                    </div>
                @endif
                @if($lead->estimated_value)
                    <div class="row">
                        <span class="label">Estimated Value</span>
                        <span class="value">৳ {{ number_format((float) $lead->estimated_value, 2) }}</span>
                    </div>
                @endif
                @if($lead->follow_up_at)
                    <div class="row">
                        <span class="label">Follow-up Date</span>
                        <span class="value">{{ \Carbon\Carbon::parse($lead->follow_up_at)->format('d M Y, h:i A') }}</span>
                    </div>
                @endif
            </div>

            @if($leadUrl)
                <div style="text-align: center; margin: 8px 0 4px;">
                    <a href="{{ $leadUrl }}" class="btn">Open Lead</a>
                </div>
            @endif
        </div>
        <div class="footer">
            Sent from {{ $companyName }} CRM. You're receiving this because the lead was assigned to your user account.
        </div>
    </div>
</body>
</html>
