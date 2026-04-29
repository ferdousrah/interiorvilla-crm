<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $subject }}</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; color: #1f2937; }
        .wrap { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .pill { display: inline-block; padding: 4px 10px; background: #eef5eb; color: #1f7a39; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 14px 0 6px; }
        .sub { font-size: 14px; color: #4b5563; margin: 0 0 20px; line-height: 1.55; }
        .lead-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; }
        .lead-card .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .lead-card .lead-name { font-size: 15px; font-weight: 700; color: #111827; margin-top: 2px; }
        .lead-card .lead-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .body-text { background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-line; margin-bottom: 22px; }
        .actor { font-size: 12px; color: #6b7280; margin-bottom: 14px; }
        .actor strong { color: #111827; }
        .btn { display: inline-block; padding: 12px 22px; background: #4f46e5; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <span class="pill">Lead Update</span>
            <h1 class="h1">{{ $headline }}</h1>

            @if($actor)
                <p class="actor">By <strong>{{ $actor->name }}</strong></p>
            @endif

            <div class="body-text">{{ $body }}</div>

            <div class="lead-card">
                <div class="label">Lead</div>
                <div class="lead-name">
                    @if($lead->type === 'corporate' && !empty($lead->company_name))
                        {{ $lead->company_name }}
                        <span style="font-weight: 400; color: #6b7280;">— {{ $lead->name }}</span>
                    @else
                        {{ $lead->name }}
                    @endif
                </div>
                <div class="lead-meta">
                    {{ $lead->code }}
                    @if($lead->phone) · {{ $lead->phone }} @endif
                    @if($lead->status) · Status: <strong style="color: #111827;">{{ str_replace('_', ' ', $lead->status) }}</strong> @endif
                </div>
            </div>

            @if($leadUrl)
                <div style="text-align: center; margin: 4px 0;">
                    <a href="{{ $leadUrl }}" class="btn">Open Lead</a>
                </div>
            @endif
        </div>
        <div class="footer">
            Sent from {{ $companyName }} CRM. You're receiving this because you created this lead.
        </div>
    </div>
</body>
</html>
