use crate::error::KivraError;
use crate::models::{AuthSessionTokens, AuthTokenExchangeRequest, AuthTokenExchangeResponse};
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    time::{Duration, Instant},
};

#[tauri::command]
pub(crate) async fn wait_for_auth_callback() -> Result<String, KivraError> {
    tauri::async_runtime::spawn_blocking(wait_for_loopback_auth_callback)
        .await
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?
}

#[tauri::command]
pub(crate) async fn exchange_auth_code(
    supabase_url: String,
    supabase_anon_key: String,
    code: String,
    code_verifier: String,
) -> Result<AuthSessionTokens, KivraError> {
    if !supabase_url.starts_with("https://") {
        return Err(KivraError::AuthExchange(
            "Supabase URL must use HTTPS".to_string(),
        ));
    }

    if supabase_anon_key.is_empty() || code.is_empty() || code_verifier.is_empty() {
        return Err(KivraError::AuthExchange(
            "Missing OAuth token exchange input".to_string(),
        ));
    }

    let token_url = format!(
        "{}/auth/v1/token?grant_type=pkce",
        supabase_url.trim_end_matches('/')
    );
    let response = reqwest::Client::new()
        .post(token_url)
        .header("apikey", &supabase_anon_key)
        .bearer_auth(&supabase_anon_key)
        .json(&AuthTokenExchangeRequest {
            auth_code: &code,
            code_verifier: &code_verifier,
        })
        .send()
        .await
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;

    if !status.is_success() {
        return Err(KivraError::AuthExchange(format!(
            "Supabase token exchange failed ({status}): {body}"
        )));
    }

    let session = serde_json::from_str::<AuthTokenExchangeResponse>(&body)
        .map_err(|error| KivraError::AuthExchange(error.to_string()))?;

    Ok(AuthSessionTokens {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        provider_refresh_token: session.provider_refresh_token,
        provider_token: session.provider_token,
        token_type: session.token_type,
        user: session.user,
    })
}

fn wait_for_loopback_auth_callback() -> Result<String, KivraError> {
    let listener = TcpListener::bind("127.0.0.1:3000")
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;
    listener
        .set_nonblocking(true)
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;

    let started_at = Instant::now();

    loop {
        match listener.accept() {
            Ok((stream, _)) => return read_auth_callback_request(stream),
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                if started_at.elapsed() > Duration::from_secs(120) {
                    return Err(KivraError::AuthCallback(
                        "Timed out waiting for OAuth redirect".to_string(),
                    ));
                }

                std::thread::sleep(Duration::from_millis(100));
            }
            Err(error) => return Err(KivraError::AuthCallback(error.to_string())),
        }
    }
}

fn read_auth_callback_request(mut stream: TcpStream) -> Result<String, KivraError> {
    let mut buffer = [0_u8; 4096];
    let byte_count = stream
        .read(&mut buffer)
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;
    let request = String::from_utf8_lossy(&buffer[..byte_count]);
    let request_target = request
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .ok_or_else(|| KivraError::AuthCallback("Invalid OAuth callback request".to_string()))?;
    let response = build_auth_callback_response(resolve_auth_callback_language(request_target));

    stream
        .write_all(response.as_bytes())
        .map_err(|error| KivraError::AuthCallback(error.to_string()))?;

    Ok(format!("http://127.0.0.1:3000{request_target}"))
}

fn resolve_auth_callback_language(request_target: &str) -> &str {
    let query = request_target
        .split_once('?')
        .map(|(_, query)| query)
        .unwrap_or_default();

    for pair in query.split('&') {
        let Some((key, value)) = pair.split_once('=') else {
            continue;
        };

        if key == "lang" {
            return match value {
                "ko" => "ko",
                _ => "en",
            };
        }
    }

    "en"
}

fn build_auth_callback_response(language: &str) -> String {
    let copy = if language == "ko" {
        (
            "ko",
            "Kivra 로그인 완료",
            "GitHub 연결 완료",
            "로그인되었습니다.",
            "Kivra가 보안 콜백을 받아 데스크톱 앱 안에서 로그인을 마무리하고 있습니다.",
            "이 탭을 닫고 Kivra로 돌아가세요.",
        )
    } else {
        (
            "en",
            "Kivra sign-in complete",
            "GitHub connected",
            "You're signed in.",
            "Kivra received the secure callback and is finishing sign-in inside the desktop app.",
            "You can close this tab and return to Kivra.",
        )
    };

    format!(
        concat!(
            "HTTP/1.1 200 OK\r\n",
            "Content-Type: text/html; charset=utf-8\r\n",
            "Connection: close\r\n",
            "\r\n",
            "<!doctype html><html lang=\"{}\"><head><meta charset=\"utf-8\"/>",
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>",
            "<title>{}</title>",
            "<style>",
            ":root{{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;",
            "background:#0b0f14;color:#f5f7fb}}",
            "body{{margin:0;min-height:100vh;display:grid;place-items:center;",
            "background:radial-gradient(circle at 50% 0%,#1e293b 0,#0b0f14 52%)}}",
            "main{{width:min(460px,calc(100vw - 40px));text-align:center}}",
            ".brand{{font-size:13px;color:#94a3b8;margin-bottom:20px;letter-spacing:.08em;",
            "text-transform:uppercase}}",
            ".mark{{width:56px;height:56px;margin:0 auto 18px;display:grid;place-items:center;",
            "border-radius:16px;background:#10b981;color:#02140e;box-shadow:0 20px 50px #10b98133}}",
            "h1{{font-size:24px;margin:0 0 10px}}",
            "p{{margin:0;color:#a8b3c7;line-height:1.6}}",
            ".eyebrow{{font-size:13px;color:#34d399;font-weight:700;margin-bottom:6px}}",
            ".panel{{margin-top:24px;padding:14px 16px;border:1px solid #223047;",
            "border-radius:12px;background:#111827;color:#cbd5e1;font-size:14px;",
            "display:flex;align-items:center;justify-content:center;gap:8px}}",
            ".dot{{width:8px;height:8px;border-radius:999px;background:#34d399;",
            "box-shadow:0 0 0 6px #34d3991c}}",
            "</style></head><body><main>",
            "<div class=\"brand\">Kivra</div>",
            "<div class=\"mark\" aria-hidden=\"true\">",
            "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" ",
            "stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\">",
            "<path d=\"M20 6 9 17l-5-5\"/></svg></div>",
            "<p class=\"eyebrow\">{}</p>",
            "<h1>{}</h1>",
            "<p>{}</p>",
            "<div class=\"panel\"><span class=\"dot\"></span>",
            "<span>{}</span></div>",
            "</main>",
            "</body></html>"
        ),
        copy.0, copy.1, copy.2, copy.3, copy.4, copy.5
    )
}
