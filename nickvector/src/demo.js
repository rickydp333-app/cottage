export function demoArtwork() {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 1000
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 800, 1000)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  const shape = (points, fill, width = 8) => {
    context.beginPath()
    points(context)
    context.closePath()
    context.fillStyle = fill
    context.fill()
    context.strokeStyle = '#222324'
    context.lineWidth = width
    context.stroke()
  }
  shape(path => { path.moveTo(364, 518); path.lineTo(380, 875); path.lineTo(410, 934); path.lineTo(442, 873); path.lineTo(437, 518) }, '#c3cbd0')
  shape(path => { path.moveTo(403, 552); path.lineTo(411, 914); path.lineTo(438, 871); path.lineTo(431, 552) }, '#788990', 4)
  shape(path => { path.moveTo(337, 570); path.bezierCurveTo(245, 532, 146, 500, 140, 372); path.bezierCurveTo(278, 397, 317, 482, 337, 570) }, '#54796a')
  shape(path => { path.moveTo(460, 596); path.bezierCurveTo(570, 538, 652, 450, 649, 334); path.bezierCurveTo(503, 390, 470, 482, 460, 596) }, '#54796a')
  shape(path => { path.moveTo(342, 697); path.bezierCurveTo(221, 689, 153, 631, 144, 547); path.bezierCurveTo(273, 563, 327, 617, 342, 697) }, '#759b78')
  shape(path => { path.moveTo(458, 750); path.bezierCurveTo(574, 718, 636, 644, 620, 558); path.bezierCurveTo(506, 616, 472, 651, 458, 750) }, '#759b78')
  context.strokeStyle = '#222324'; context.lineWidth = 5
  for (const [startX, startY, endX, endY] of [[157, 400, 329, 554], [638, 364, 475, 570], [162, 569, 330, 680], [603, 585, 468, 733]]) {
    context.beginPath(); context.moveTo(startX, startY); context.lineTo(endX, endY); context.stroke()
  }
  shape(path => { path.moveTo(308, 241); path.bezierCurveTo(241, 155, 326, 97, 398, 131); path.bezierCurveTo(492, 70, 563, 145, 534, 227); path.bezierCurveTo(637, 238, 631, 344, 565, 381); path.bezierCurveTo(581, 480, 500, 539, 416, 499); path.bezierCurveTo(316, 556, 218, 489, 253, 401); path.bezierCurveTo(158, 351, 209, 225, 308, 241) }, '#d84a42')
  shape(path => { path.moveTo(309, 239); path.bezierCurveTo(285, 168, 358, 156, 402, 215); path.bezierCurveTo(425, 131, 521, 163, 509, 238); path.bezierCurveTo(573, 235, 587, 308, 536, 353); path.bezierCurveTo(548, 421, 475, 466, 421, 429); path.bezierCurveTo(360, 482, 269, 432, 291, 371); path.bezierCurveTo(232, 326, 255, 260, 309, 239) }, '#ec7865')
  shape(path => { path.moveTo(311, 270); path.bezierCurveTo(349, 233, 382, 247, 397, 289); path.bezierCurveTo(413, 234, 483, 223, 503, 278); path.bezierCurveTo(525, 325, 486, 349, 455, 363); path.bezierCurveTo(409, 402, 350, 393, 321, 354); path.bezierCurveTo(292, 327, 292, 297, 311, 270) }, '#b63534')
  shape(path => { path.moveTo(323, 301); path.bezierCurveTo(340, 266, 383, 278, 399, 312); path.bezierCurveTo(422, 267, 471, 262, 487, 300); path.bezierCurveTo(473, 341, 423, 357, 398, 347); path.bezierCurveTo(368, 363, 330, 342, 323, 301) }, '#ec7865', 6)
  shape(path => { path.moveTo(361, 312); path.bezierCurveTo(385, 298, 423, 303, 443, 320); path.bezierCurveTo(416, 335, 386, 335, 361, 312) }, '#722c30', 5)
  shape(path => { path.moveTo(324, 526); path.bezierCurveTo(361, 541, 450, 540, 482, 519); path.lineTo(490, 551); path.bezierCurveTo(444, 574, 358, 574, 312, 555) }, '#dbad52', 6)
  context.fillStyle = '#222324'
  for (const [centerX, centerY] of [[197, 196], [620, 224], [214, 792], [582, 844]]) {
    context.beginPath(); context.moveTo(centerX, centerY - 12); context.lineTo(centerX + 4, centerY - 4); context.lineTo(centerX + 12, centerY); context.lineTo(centerX + 4, centerY + 4); context.lineTo(centerX, centerY + 12); context.lineTo(centerX - 4, centerY + 4); context.lineTo(centerX - 12, centerY); context.lineTo(centerX - 4, centerY - 4); context.fill()
  }
  return canvas
}