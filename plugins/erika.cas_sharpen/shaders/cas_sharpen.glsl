//!DESC Contrast Adaptive Sharpening (CAS)
//!HOOK MAIN
//!BIND HOOKED

// MIT License — single-pass 5-tap Contrast Adaptive Sharpening.
// Enhances local detail while clamping sharpening gain in high-contrast edges
// to avoid ringing halos and in near-flat areas to avoid amplifying noise.

const float SHARPNESS = 0.55;

vec4 hook() {
    vec2 uv = HOOKED_pos;
    vec2 pt = HOOKED_pt;

    vec4 center = HOOKED_tex(uv);
    vec3 e = center.rgb;
    vec3 b = HOOKED_tex(clamp(uv + vec2(0.0, -pt.y), 0.0, 1.0)).rgb;
    vec3 d = HOOKED_tex(clamp(uv + vec2(-pt.x, 0.0), 0.0, 1.0)).rgb;
    vec3 f = HOOKED_tex(clamp(uv + vec2(pt.x, 0.0), 0.0, 1.0)).rgb;
    vec3 h = HOOKED_tex(clamp(uv + vec2(0.0, pt.y), 0.0, 1.0)).rgb;

    vec3 mn = min(min(min(d, e), min(f, b)), h);
    vec3 mx = max(max(max(d, e), max(f, b)), h);

    vec3 amp = clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0);
    amp = sqrt(amp);

    float peak = -1.0 / mix(8.0, 5.0, SHARPNESS);
    vec3 w = amp * peak;

    vec3 outRgb = (e + (b + d + f + h) * w) / (1.0 + 4.0 * w);
    return vec4(clamp(outRgb, 0.0, 1.0), center.a);
}
