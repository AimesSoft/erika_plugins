// Draws a plugin's icon.png: the SF Symbol its iconId names, white, on a
// rounded square of one of Erika's accents, 256 × 256.
//
//   swift tools/make_icon.swift <symbol> <#RRGGBB> <out.png>
import AppKit

let arguments = CommandLine.arguments
guard arguments.count == 4 else {
    FileHandle.standardError.write("usage: make_icon.swift <symbol> <#RRGGBB> <out.png>\n".data(using: .utf8)!)
    exit(2)
}
let symbol = arguments[1]
let hex = arguments[2].trimmingCharacters(in: CharacterSet(charactersIn: "#"))
let output = URL(fileURLWithPath: arguments[3])

let value = UInt32(hex, radix: 16) ?? 0x7F7F7F
func channel(_ shift: UInt32) -> CGFloat { CGFloat((value >> shift) & 0xFF) / 255 }
let accent = NSColor(srgbRed: channel(16), green: channel(8), blue: channel(0), alpha: 1)

let size = 256
guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
    samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
    bytesPerRow: 0, bitsPerPixel: 0
) else { exit(1) }
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

// The tile: the accent, lighter at the top.
let tile = NSRect(x: 8, y: 8, width: 240, height: 240)
let shape = NSBezierPath(roundedRect: tile, xRadius: 56, yRadius: 56)
let lighter = accent.blended(withFraction: 0.18, of: .white) ?? accent
let darker = accent.blended(withFraction: 0.12, of: .black) ?? accent
NSGradient(starting: lighter, ending: darker)?.draw(in: shape, angle: -90)

// The symbol, white, at about half the tile.
let configuration = NSImage.SymbolConfiguration(pointSize: 112, weight: .semibold)
    .applying(NSImage.SymbolConfiguration(paletteColors: [.white]))
if let image = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)?
    .withSymbolConfiguration(configuration) {
    let bounds = image.size
    let scale = min(132 / bounds.width, 132 / bounds.height)
    let drawn = NSSize(width: bounds.width * scale, height: bounds.height * scale)
    image.draw(in: NSRect(x: (256 - drawn.width) / 2, y: (256 - drawn.height) / 2,
                          width: drawn.width, height: drawn.height))
} else {
    FileHandle.standardError.write("no symbol \(symbol)\n".data(using: .utf8)!)
    exit(1)
}
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: output)
