// Frame-specific element positioning configurations
// All coordinates are based on reference canvas size: 720x487.2

interface FrameLayoutElement {
  key: string;
  x: number;
  y: number;
  circular?: boolean; // Optional property to make logo circular
  borderRadius?: number; // Optional property to set custom rounded corners
  size?: { width: number; height: number }; // Optional property to control element size
  color?: string; // Optional property to set text color
}

interface FrameLayouts {
  [key: string]: FrameLayoutElement[];
}

interface FrameAssets {
  [key: string]: string;
}

export const FRAME_LAYOUTS: FrameLayouts = {
  frame3: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 50, y: 445 }, // Default position - no manual position provided
    { key: 'email', x: 250, y: 445 }, // Default position - no manual position provided
    { key: 'website', x: 450, y: 445 }, // Default position - no manual position provided
    { key: 'address', x: 61, y: 422, color: 'black' }, // Updated to position address at (x: 29.1, y: 297.6) on canvas
    { key: 'category', x: 250, y: 422, color: 'black' }, // Updated to position category at (x: 119.2, y: 297.6) on canvas
    { key: 'logo', x: 599, y: 8 }, // Default position - no manual position provided
  ],
  frame4: [
    { key: 'companyName', x: 20, y: 8 }, // Will be positioned based on current canvas position
    { key: 'phone', x: 84, y: 432 }, // Updated to position phone at (x: 40.2, y: 304.3) on canvas
    { key: 'email', x: 84, y: 451 }, // Updated to position email at (x: 40.2, y: 317.8) on canvas
    { key: 'website', x: 456, y: 432 }, // Updated to position website at (x: 217.7, y: 304.3) on canvas
    { key: 'address', x: 447, y: 456 }, // Updated to position address at (x: 212.5, y: 321.6) on canvas
    { key: 'category', x: 253, y: 434 }, // Updated to position category at (x: 120.2, y: 305.6) on canvas
    { key: 'logo', x: 599, y: 8 }, // Logo positioned with moderate right alignment
  ],
  frame5: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 15.1, y: 27.9) on canvas
    { key: 'phone', x: 140, y: 420 }, // Updated to position phone at (x: 66.8, y: 295.2) on canvas
    { key: 'email', x: 140, y: 440 }, // Updated to position email at (x: 66.8, y: 312.4) on canvas
    { key: 'website', x: 450, y: 404 }, // Updated to position website at (x: 214.1, y: 288.0) on canvas
    { key: 'address', x: 449, y: 421 }, // Updated to position address at (x: 213.5, y: 296.4) on canvas
    { key: 'category', x: 449, y: 444 }, // Updated to position category at (x: 213.5, y: 312.4) on canvas
    { key: 'logo', x: 15, y: 391, circular: true, size: { width: 60, height: 61 } }, // Updated to position logo at (x: 15.3, y: 279.0) on canvas - CIRCULAR - LARGER SIZE
  ],
  frame6: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 50, y: 440 }, // Default position - no manual position provided
    { key: 'email', x: 50, y: 409 }, // Default position - no manual position provided
    { key: 'website', x: 441, y: 409 }, // Default position - no manual position provided
    { key: 'address', x: 441, y: 440 }, // Default position - no manual position provided
    { key: 'category', x: 69, y: 364, color: 'black' }, // Updated to position category at (x: 33.1, y: 256.2) on canvas
    { key: 'logo', x: 599, y: 8 }, // Default position - no manual position provided
  ],
  frame8: [
    { key: 'companyName', x: 20, y: 8 },
    { key: 'phone', x: 190, y: 441 }, // Updated to position phone at (x: 90.6, y: 310.4) on canvas
    { key: 'email', x: 190, y: 402 }, // Updated to position email at (x: 90.6, y: 283.5) on canvas
    { key: 'website', x: 402, y: 402 }, // Updated to position website at (x: 191.7, y: 283.5) on canvas
    { key: 'address', x: 402, y: 441 }, // Updated to position address at (x: 191.7, y: 310.4) on canvas
    { key: 'category', x: 402, y: 417 }, // Updated to position category at (x: 191.7, y: 294.4) on canvas
    { key: 'logo', x: 37, y: 388, size: { width: 53, height: 51 } }, // Updated to position logo at (x: 15.3, y: 273.7) on canvas
  ],
  frame11: [
    { key: 'companyName', x: 20, y: 8 },
    { key: 'phone', x: 148, y: 433 }, // Updated to position phone at (x: 70.6, y: 305.0) on canvas
    { key: 'email', x: 149, y: 465 }, // Updated to position email at (x: 70.8, y: 327.4) on canvas
    { key: 'website', x: 342, y: 465 }, // Updated to position website at (x: 162.9, y: 327.4) on canvas
    { key: 'address', x: 339, y: 442 }, // Updated to position address at (x: 161.7, y: 311.4) on canvas
    { key: 'category', x: 527, y: 465 }, // Updated to position category at (x: 251.3, y: 327.4) on canvas
    { key: 'logo', x: 27, y: 352, circular: true, size: { width: 60, height: 60 } }, // Updated to position logo at (x: 19.1, y: 245.6) on canvas
  ],
  frame12: [
    { key: 'companyName', x: 55, y: 25 }, // Default position - no manual position provided
    { key: 'phone', x: 164, y: 68, color: 'black' }, // Updated to position phone at (x: 78.1, y: 47.7) on canvas
    { key: 'email', x: 323, y: 68, color: 'black' }, // Updated to position email at (x: 153.9, y: 47.7) on canvas
    { key: 'website', x: 482, y: 460 }, // Updated to position website at (x: 229.8, y: 324.2) on canvas
    { key: 'address', x: 5, y: 460 }, // Updated to position address at (x: 2.2, y: 324.2) on canvas
    { key: 'category', x: 365, y: 40 }, // Updated to position category at (x: 174.3, y: 31.6) on canvas
    { key: 'logo', x: 564, y: 19, circular: true, size: { width: 61, height: 60 } }, // Updated to position logo at (x: 267.0, y: 17.6) on canvas
  ],
  frame13: [
    { key: 'companyName', x: 521, y: 12 }, // Updated to position companyName at (x: 248.6, y: 8.5) on canvas
    { key: 'phone', x: 164, y: 75 }, // Updated to position phone at (x: 78.3, y: 52.8) on canvas
    { key: 'email', x: 323, y: 75 }, // Updated to position email at (x: 154.1, y: 52.7) on canvas
    { key: 'website', x: 521, y: 453 }, // Updated to position website at (x: 248.6, y: 319.1) on canvas
    { key: 'address', x: 25, y: 453 }, // Updated to position address at (x: 11.8, y: 319.3) on canvas
    { key: 'category', x: 184, y: 43 }, // Updated to position category at (x: 87.7, y: 30.5) on canvas
    { key: 'logo', x: 41, y: 23, circular: true, size: { width: 61, height: 60 } }, // Updated to position logo at (x: 19.3, y: 16.5) on canvas
  ],
  frame15: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 16, y: 436 }, // Updated to position phone at (x: 0.0, y: 307.5) on canvas
    { key: 'email', x: 233, y: 436 }, // Updated to position email at (x: 111.2, y: 311.4) on canvas
    { key: 'website', x: 484, y: 436 }, // Updated to position website at (x: 230.8, y: 307.5) on canvas
    { key: 'address', x: 16, y: 465 }, // Updated to position address at (x: 7.6, y: 327.4) on canvas
    { key: 'category', x: 484, y: 465 }, // Updated to position category at (x: 230.8, y: 327.4) on canvas
    { key: 'logo', x: 599, y: 8 }, // Default position - no manual position provided
  ],
  frame16: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 8.1, y: 8.2) on canvas
    { key: 'phone', x: 0, y: 412 }, // Updated to position phone at (x: 0.0, y: 290.6) on canvas
    { key: 'email', x: 17, y: 458 }, // Updated to position email at (x: 8.1, y: 322.6) on canvas
    { key: 'website', x: 245, y: 458 }, // Updated to position website at (x: 116.9, y: 322.6) on canvas
    { key: 'address', x: 0, y: 435 }, // Updated to position address at (x: 0.0, y: 306.6) on canvas
    { key: 'category', x: 494, y: 458, color: 'blue' }, // Updated to position category at (x: 235.6, y: 327.4) on canvas
    { key: 'logo', x: 599, y: 8 }, // Updated to position logo at (x: 285.7, y: 8.2) on canvas
  ],
  frame17: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 9.5, y: 5.9) on canvas
    { key: 'phone', x: 20, y: 420, color: 'black' }, // Default position - no manual position provided
    { key: 'email', x: 190, y: 420, color: 'black' }, // Default position - no manual position provided
    { key: 'website', x: 471, y: 420, color: 'black' }, // Updated to position website at (x: 224.7, y: 296.0) on canvas
    { key: 'address', x: 20, y: 443, color: 'black' }, // Default position - no manual position provided
    { key: 'category', x: 471, y: 443, color: 'black' }, // Updated to position category at (x: 232.8, y: 312.0) on canvas
    { key: 'logo', x: 599, y: 8 }, // Updated to position logo at (x: 289.6, y: 5.9) on canvas
  ],
  frame18: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 237, y: 389, color: 'black' }, // Updated to position phone at (x: 113.0, y: 273.8) on canvas
    { key: 'email', x: 390, y: 389, color: 'black' }, // Updated to position email at (x: 186.0, y: 273.8) on canvas
    { key: 'website', x: 247, y: 418, color: 'black' }, // Updated to position website at (x: 113.0, y: 294.1) on canvas
    { key: 'address', x: 229, y: 445, color: 'black' }, // Updated to position address at (x: 95.8, y: 318.1) on canvas
    { key: 'category', x: 462, y: 418, color: 'black' }, // Updated to position category at (x: 220.0, y: 294.6) on canvas
    { key: 'logo', x: 118, y: 390, circular: true, size: { width: 45, height: 45 } }, // Updated to position logo at (x: 51.6, y: 274.2) on canvas
  ],
  frame19: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 7.2, y: 1.7) on canvas
    { key: 'phone', x: 15, y: 415 }, // Default position - no manual position provided
    { key: 'email', x: 232, y: 415 }, // Updated to position email at (x: 110.6, y: 292.5) on canvas
    { key: 'website', x: 500, y: 438 }, // Updated to position website at (x: 238.0, y: 308.5) on canvas
    { key: 'address', x: 15, y: 435 }, // Default position - no manual position provided
    { key: 'category', x: 500, y: 415 }, // Updated to position category at (x: 238.0, y: 292.5) on canvas
    { key: 'logo', x: 599, y: 8 }, // Updated to position logo at (x: 288.3, y: 6.0) on canvas
  ],
  frame20: [
    { key: 'companyName', x: 65, y: 16 }, // Updated to position companyName at (x: 31, y: 11) on canvas
    { key: 'phone', x: 88, y: 409 }, // Updated to position phone at (x: 42.2, y: 287.9) on canvas
    { key: 'email', x: 88, y: 439 }, // Updated to position email at (x: 42.2, y: 303.9) on canvas
    { key: 'website', x: 451, y: 409 }, // Updated to position website at (x: 215.1, y: 287.9) on canvas
    { key: 'address', x: 424, y: 462 }, // Updated to position address at (x: 202.4, y: 325.4) on canvas
    { key: 'category', x: 119, y: 462 }, // Updated to position category at (x: 56.8, y: 325.4) on canvas
    { key: 'logo', x: 27, y: 412, circular: true, size: { width: 30, height: 30 } }, // Updated to position logo at (x: 0.0, y: 282.6) on canvas
  ],
  frame21: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 0.0, y: 5.2) on canvas
    { key: 'phone', x: 262, y: 398 }, // Updated to position phone at (x: 191.8, y: 281.0) on canvas
    { key: 'email', x: 0, y: 421 }, // Updated to position email at (x: 0.0, y: 297.0) on canvas
    { key: 'website', x: 488, y: 376 }, // Updated to position website at (x: 233.2, y: 265.0) on canvas
    { key: 'address', x: 262, y: 420 }, // Updated to position address at (x: 116.0, y: 295.1) on canvas
    { key: 'category', x: 0, y: 398 }, // Updated to position category at (x: 0.0, y: 281.0) on canvas
    { key: 'logo', x: 599, y: 8 }, // Updated to position logo at (x: 283.5, y: 9.5) on canvas
  ],
  frame22: [
    { key: 'companyName', x: 42, y: 16 }, // Updated to position companyName at (x: 20.0, y: 11.3) on canvas
    { key: 'phone', x: 42, y: 427 }, // Updated to position phone at (x: 20.0, y: 301.2) on canvas
    { key: 'email', x: 260, y: 448 }, // Updated to position email at (x: 123.9, y: 315.3) on canvas
    { key: 'website', x: 473, y: 427 }, // Updated to position website at (x: 225.5, y: 301.2) on canvas
    { key: 'address', x: 42, y: 450 }, // Updated to position address at (x: 20.0, y: 317.2) on canvas
    { key: 'category', x: 260, y: 427 }, // Updated to position category at (x: 115.6, y: 301.2) on canvas
    { key: 'logo', x: 578, y: 22, circular: true, }, // Updated to position logo at (x: 275.6, y: 15.6) on canvas
  ],
  frame23: [
    { key: 'companyName', x: 25, y: 15 }, // Default position - no manual position provided
    { key: 'phone', x: 518, y: 416 }, // Updated to position phone at (x: 247.0, y: 293.4) on canvas
    { key: 'email', x: 25, y: 459 }, // Updated to position email at (x: 11.9, y: 323.5) on canvas
    { key: 'website', x: 25, y: 437 }, // Updated to position website at (x: 11.9, y: 307.5) on canvas
    { key: 'address', x: 496, y: 448 }, // Updated to position address at (x: 236.9, y: 315.5) on canvas
    { key: 'category', x: 275, y: 459 }, // Updated to position category at (x: 131.4, y: 323.5) on canvas
    { key: 'logo', x: 580, y: 20, circular: true, }, // Updated to position logo at (x: 271.4, y: 17.3) on canvas
  ],
  frame24: [
    { key: 'companyName', x: 15, y: 5 }, // Default position - no manual position provided
    { key: 'phone', x: 24, y: 420, color: 'black' }, // Updated to position phone at (x: 11.5, y: 296.7) on canvas
    { key: 'email', x: 238, y: 440, color: 'black' }, // Updated to position email at (x: 117.8, y: 312.7) on canvas
    { key: 'website', x: 460, y: 440, color: 'black' }, // Updated to position website at (x: 219.4, y: 312.7) on canvas
    { key: 'address', x: 24, y: 444, color: 'black' }, // Updated to position address at (x: 11.5, y: 326.8) on canvas
    { key: 'category', x: 325, y: 421, color: 'black' }, // Updated to position category at (x: 155.0, y: 296.7) on canvas
    { key: 'logo', x: 580, y: 20, circular: true, }, // Updated to position logo at (x: 269.5, y: 20.1) on canvas
  ],
  frame25: [
    { key: 'companyName', x: 22, y: 10 }, // Updated to position companyName at (x: 20.1, y: 9.2) on canvas
    { key: 'phone', x: 26, y: 430 }, // Updated to position phone at (x: 9.5, y: 309.1) on canvas
    { key: 'email', x: 486, y: 438 }, // Updated to position email at (x: 232.1, y: 309.1) on canvas
    { key: 'website', x: 256, y: 450 }, // Updated to position website at (x: 122.1, y: 317.1) on canvas
    { key: 'address', x: 42, y: 450 }, // Updated to position address at (x: 20.1, y: 317.1) on canvas
    { key: 'category', x: 256, y: 427 }, // Updated to position category at (x: 122.1, y: 301.1) on canvas
    { key: 'logo', x: 591, y: 14 }, // Updated to position logo at (x: 282.2, y: 13.5) on canvas
  ],
  frame26: [
    { key: 'companyName', x: 20, y: 8 }, // Updated to position companyName at (x: 12.3, y: 8.5) on canvas
    { key: 'phone', x: 271, y: 406 }, // Updated to position phone at (x: 129.3, y: 286.4) on canvas
    { key: 'email', x: 457, y: 406 }, // Updated to position email at (x: 217.9, y: 286.4) on canvas
    { key: 'website', x: 63, y: 406 }, // Updated to position website at (x: 29.9, y: 286.4) on canvas
    { key: 'address', x: 293, y: 435 }, // Updated to position address at (x: 139.8, y: 302.4) on canvas
    { key: 'category', x: 42, y: 440 }, // Updated to position category at (x: 20.0, y: 310.4) on canvas
    { key: 'logo', x: 599, y: 8 }, // Updated to position logo at (x: 281.0, y: 8.5) on canvas
  ],
  frame27: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 180, y: 419, color:'#123C69' }, // Updated to position phone at (x: 85.8, y: 295.1) on canvas
    { key: 'email', x: 180, y: 441, color:'#123C69' }, // Updated to position email at (x: 85.8, y: 311.1) on canvas
    { key: 'website', x: 476, y: 419 , color:'#123C69'}, // Updated to position website at (x: 227.2, y: 295.1) on canvas
    { key: 'address', x: 0, y: 460, color:'#123C69' }, // Updated to position address at (x: 0.0, y: 320.8) on canvas
    { key: 'category', x: 476, y: 441, color:'#123C69' }, // Updated to position category at (x: 227.2, y: 311.1) on canvas
    { key: 'logo', x: 35, y: 370, circular: true ,size: { width: 61, height: 61 } }, // Updated to position logo at (x: 23.8, y: 269.3) on canvas
  ],
  frame28: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 74, y: 442, }, // Updated to position phone at (x: 35.2, y: 311.4) on canvas
    { key: 'email', x: 421, y: 465 }, // Updated to position email at (x: 196.0, y: 327.4) on canvas
    { key: 'website', x: 421, y: 442 }, // Updated to position website at (x: 196.0, y: 311.4) on canvas
    { key: 'address', x: 74, y: 465 }, // Updated to position address at (x: 35.2, y: 327.4) on canvas
    { key: 'category', x: 258, y: 419 }, // Updated to position category at (x: 123.2, y: 295.4) on canvas
    { key: 'logo', x: 599, y: 8 }, // Default position - no manual position provided
  ],
  frame29: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 539, y: 432 }, // Updated to position phone at (x: 257.0, y: 304.7) on canvas
    { key: 'email', x: 144, y: 421, color:'#76787bff' }, // Updated to position email at (x: 68.5, y: 296.7) on canvas
    { key: 'website', x: 442, y: 421, color:'#76787bff' }, // Updated to position website at (x: 220.1, y: 296.7) on canvas
    { key: 'address', x: 144, y: 440 , color:'#76787bff'}, // Updated to position address at (x: 68.5, y: 312.7) on canvas
    { key: 'category', x: 269, y: 467 }, // Updated to position category at (x: 128.1, y: 328.7) on canvas
    { key: 'logo', x: 22, y: 385, size: { width: 49, height: 50 }, borderRadius: 12 }, // Updated to position logo at (x: 16.9, y: 277.2) on canvas
  ],
  frame30: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 233, y: 443, color: 'black' }, // Updated to position phone at (x: 111.2, y: 312.0) on canvas
    { key: 'email', x: 201, y: 420, color: 'black' }, // Updated to position email at (x: 95.8, y: 296.0) on canvas
    { key: 'website', x: 447, y: 420, color: 'black' }, // Updated to position website at (x: 212.9, y: 296.0) on canvas
    { key: 'address', x: 401, y: 443, color: 'black' }, // Updated to position address at (x: 191.2, y: 312.0) on canvas
    { key: 'category', x: 242, y: 398, color: 'grey' }, // Updated to position category at (x: 115.4, y: 280.0) on canvas
    { key: 'logo', x: 25, y: 370, size: { width: 68, height: 68 }, borderRadius: 12  }, // Updated to position logo at (x: 21.4, y: 270.3) on canvas
  ],
  frame31: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 40, y: 445 }, // Default position - no manual position provided
    { key: 'email', x: 420, y: 445 }, // Updated to position email at (x: 200.2, y: 310.1) on canvas
    { key: 'website', x: 420, y: 467 }, // Updated to position website at (x: 191.7, y: 327.4) on canvas
    { key: 'address', x: 40, y: 467 }, // Updated to position address at (x: 19.1, y: 327.4) on canvas
    { key: 'category', x: 260, y: 394 }, // Updated to position category at (x: 130.3, y: 277.3) on canvas
    { key: 'logo', x: 320, y: 420.5, size: { width: 38, height: 38 }, circular: true }, // Updated to position logo at (x: 140.2, y: 291.9) on canvas
  ],
  frame32: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 15, y: 435 , color: 'black' }, // Updated to position phone at (x: 7.2, y: 306.6) on canvas
    { key: 'email', x: 483, y: 458, color: 'black' }, // Updated to position email at (x: 230.4, y: 322.6) on canvas
    { key: 'website', x: 483, y: 8, color: 'grey' }, // Updated to position website at (x: 230.6, y: 5.8) on canvas
    { key: 'address', x: 15, y: 458, color: 'black' }, // Updated to position address at (x: 7.2, y: 322.6) on canvas
    { key: 'category', x: 525, y: 435, color: 'black' }, // Updated to position category at (x: 250.3, y: 306.6) on canvas
    { key: 'logo', x: 292, y: 390, size: { width: 65, height: 64 }, borderRadius: 12 }, // Updated to position logo at (x: 152.7, y: 295.6) on canvas
  ],
  frame33: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 138, y: 430, color: 'black' }, // Updated to position phone at (x: 65.8, y: 305.6) on canvas
    { key: 'email', x: 332, y: 430, color: 'black' }, // Updated to position email at (x: 158.5, y: 305.6) on canvas
    { key: 'website',  x: 483, y: 8, color: 'grey' }, // Updated to position website at (x: 158.5, y: 200.3) on canvas
    { key: 'address', x: 119, y: 465, }, // Updated to position address at (x: 56.8, y: 327.4) on canvas
    { key: 'category', x: 492, y: 465 }, // Updated to position category at (x: 234.8, y: 327.4) on canvas
    { key: 'logo', x: 30, y: 408, size: { width: 44, height: 45 }, circular:true }, // Updated to position logo at (x: 0.8, y: 271.4) on canvas
  ],
  frame35: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 227, y: 439, color: 'black' }, // Updated to position phone at (x: 108.2, y: 309.2) on canvas
    { key: 'email', x: 386, y: 439, color: 'black' }, // Updated to position email at (x: 184.1, y: 309.2) on canvas
    { key: 'website', x: 496, y: 10, color: 'grey' }, // Updated to position website at (x: 236.8, y: 7.0) on canvas
    { key: 'address', x: 386, y: 470, color: 'grey' }, // Updated to position address at (x: 184.1, y: 331.3) on canvas
    { key: 'category', x: 124, y: 470, color: 'grey' }, // Updated to position category at (x: 59.2, y: 331.3) on canvas
    { key: 'logo', x: 34.5, y: 400, size: { width: 51, height: 52 }, borderRadius: 8 }, // Updated to position logo at (x: 23.6, y: 286.7) on canvas
  ],
  frame36: [
    { key: 'companyName', x: 20, y: 8 }, // Default position - no manual position provided
    { key: 'phone', x: 42, y: 428,  }, // Updated to position phone at (x: 20.0, y: 301.4) on canvas
    { key: 'email', x: 424, y: 428,  }, // Updated to position email at (x: 202.4, y: 301.4) on canvas
    { key: 'website', x: 42, y: 468,  }, // Updated to position website at (x: 20.0, y: 327.4) on canvas
    { key: 'address', x: 425, y: 468,  }, // Updated to position address at (x: 202.8, y: 327.2) on canvas
    { key: 'category', x: 265, y: 388, }, // Updated to position category at (x: 126.6, y: 273.2) on canvas
    { key: 'logo', x: 309, y: 410, size: { width: 51, height: 52 }, circular: true }, // Updated to position logo at (x: 151.4, y: 289.2) on canvas
  ],
  frame37: [
    { key: 'companyName', x: 0, y: 64 }, // Updated to position companyName at (x: 0.0, y: 44.8) on canvas
    { key: 'phone', x: 257, y: 25, color: 'black' }, // Updated to position phone at (x: 122.7, y: 17.6) on canvas
    { key: 'email', x: 120, y: 455, color:'black' }, // Default position - no manual position provided
    { key: 'website', x: 355, y: 455, color:'black' }, // Default position - no manual position provided
    { key: 'address', x: 120, y: 434, color: 'grey' }, // Updated to position address at (x: 46.9, y: 304.7) on canvas
    { key: 'category', x: 417, y: 25, color: 'black' }, // Updated to position category at (x: 198.6, y: 17.6) on canvas
    { key: 'logo', x: 16, y: 11, size: { width: 40, height: 41 }, borderRadius:6 }, // Updated to position logo at (x: 8.7, y: 7.6) on canvas
  ],
  // Add more frame layouts as needed
};

// Frame image assets mapping
export const FRAME_ASSETS: FrameAssets = {
  frame3: require('../assets/frames/f3.png'),
  frame4: require('../assets/frames/f4.png'),
  frame5: require('../assets/frames/f5.png'),
  frame6: require('../assets/frames/f6.png'),
  frame8: require('../assets/frames/f8.png'),
  frame11: require('../assets/frames/f11.png'),
  frame12: require('../assets/frames/f12.png'),
  frame13: require('../assets/frames/f13.png'),
  frame15: require('../assets/frames/f15.png'),
  frame16: require('../assets/frames/f16.png'),
  frame17: require('../assets/frames/f17.png'),
  frame18: require('../assets/frames/f18.png'),
  frame19: require('../assets/frames/f19.png'),
  frame20: require('../assets/frames/f20.png'),
  frame21: require('../assets/frames/f21.png'),
  frame22: require('../assets/frames/f22.png'),
  frame23: require('../assets/frames/f23.png'),
  frame24: require('../assets/frames/f24.png'),
  frame25: require('../assets/frames/f25.png'),
  frame26: require('../assets/frames/f26.png'),
  frame27: require('../assets/frames/f27.png'),
  frame28: require('../assets/frames/f28.png'),
  frame29: require('../assets/frames/f29.png'),
  frame30: require('../assets/frames/f30.png'),
  frame31: require('../assets/frames/f31.png'),
  frame32: require('../assets/frames/f32.png'),
  frame33: require('../assets/frames/f33.png'),
  frame35: require('../assets/frames/f35.png'),
  frame36: require('../assets/frames/f36.png'),
  frame37: require('../assets/frames/f37.png'),
  // Add more frame assets as needed
};

// Helper function to convert reference coordinates to canvas coordinates
export const convertReferenceToCanvas = (
  referenceX: number,
  referenceY: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  // Convert from reference (720x487.2) to actual canvas size
  const canvasX = referenceX * (canvasWidth / 720);
  const canvasY = referenceY * (canvasHeight / 487.2);

  // ✅ DEBUG: Log coordinate conversion details
  console.log('🔍 [COORDINATE CONVERSION] Debug:', {
    referenceX,
    referenceY,
    canvasWidth,
    canvasHeight,
    xScaleFactor: canvasWidth / 720,
    yScaleFactor: canvasHeight / 487.2,
    calculatedCanvasX: canvasX,
    calculatedCanvasY: canvasY,
    roundedCanvasX: Math.round(canvasX),
    roundedCanvasY: Math.round(canvasY)
  });

  return { x: canvasX, y: canvasY };
};

// Helper function to apply frame layout to layers
export const applyFrameLayoutToLayers = (
  layers: any[],
  frameId: string,
  canvasWidth: number,
  canvasHeight: number,
  originalLayers?: any[] // Optional parameter to access original layer colors
) => {
  const layout = FRAME_LAYOUTS[frameId];
  if (!layout) {
    return layers;
  }

  const updatedLayers = layers.map(layer => {
    // Find the layout configuration for this layer type
    const layoutConfig = layout.find((l: FrameLayoutElement) => l.key === layer.fieldType);

    // If no layout config for this layer type, return unchanged
    if (!layoutConfig) {
      return layer;
    }

    // Convert reference coordinates to canvas coordinates
    const canvasPosition = convertReferenceToCanvas(
      layoutConfig.x,
      layoutConfig.y,
      canvasWidth,
      canvasHeight
    );

    // Return updated layer with new position and properties
    const updatedLayer = {
      ...layer,
      position: {
        ...layer.position,
        x: canvasPosition.x,
        y: canvasPosition.y,
      },
      // Apply circular property if specified in layout config, otherwise reset to original
      ...(layoutConfig.circular !== undefined ? { isCircular: layoutConfig.circular } : { isCircular: originalLayers?.find((l: any) => l.id === layer.id)?.isCircular || false }),
      // Apply borderRadius property if specified in layout config, otherwise reset to original
      ...(layoutConfig.borderRadius !== undefined ? { borderRadius: layoutConfig.borderRadius } : { borderRadius: originalLayers?.find((l: any) => l.id === layer.id)?.borderRadius || 0 }),
      // Apply size property if specified in layout config, otherwise reset to original
      ...(layoutConfig.size !== undefined ? { size: layoutConfig.size } : { size: originalLayers?.find((l: any) => l.id === layer.id)?.size || layer.size }),
      // Apply color property if specified in layout config to the style object
      // If no color specified, preserve original style color (don't override with black)
      ...(layoutConfig.color && {
        style: {
          ...layer.style,
          color: layoutConfig.color
        }
      }),
      // If no color specified, restore original style color (remove any frame-applied color)
      ...(!layoutConfig.color && originalLayers && layer.style?.color && layer.style.color !== originalLayers.find((l: any) => l.id === layer.id)?.style?.color && {
        style: {
          ...layer.style,
          color: originalLayers.find((l: any) => l.id === layer.id)?.style?.color || undefined
        }
      }),
    };

    // ✅ DEBUG: Check if logo circular property is being applied/reset
    if (layer.fieldType === 'logo') {
      console.log(`🔍 [LOGO DEBUG] ${frameId} logo processing:`, {
        fieldType: layer.fieldType,
        layoutConfigCircular: layoutConfig.circular,
        layerIsCircular: layer.isCircular,
        originalIsCircular: originalLayers?.find((l: any) => l.id === layer.id)?.isCircular,
        updatedLayerIsCircular: updatedLayer.isCircular,
        finalCircularProperty: updatedLayer.isCircular
      });
    }

    // ✅ DEBUG: Check if phone/email X coordinates are being applied correctly for frame4
    if ((layer.fieldType === 'phone' || layer.fieldType === 'email') && frameId === 'frame4') {
      console.log(`🔍 [FRAME4 ${layer.fieldType.toUpperCase()} DEBUG]:`, {
        fieldType: layer.fieldType,
        layoutConfigX: layoutConfig.x,
        layoutConfigY: layoutConfig.y,
        canvasPositionX: canvasPosition.x,
        canvasPositionY: canvasPosition.y,
        expectedCanvasX: layer.fieldType === 'phone' ? 40.2 : 40.2,
        expectedCanvasY: layer.fieldType === 'phone' ? 304.3 : 317.8,
        xDifference: Math.abs(canvasPosition.x - (layer.fieldType === 'phone' ? 40.2 : 40.2)),
        yDifference: Math.abs(canvasPosition.y - (layer.fieldType === 'phone' ? 304.3 : 317.8))
      });
    }

    // ✅ DEBUG: Check if color property is being applied for frame10
    if (frameId === 'frame10' && layoutConfig.color) {
      console.log(`🎨 [FRAME10 COLOR DEBUG] Applying color to ${layer.fieldType}:`, {
        fieldType: layer.fieldType,
        layoutConfigColor: layoutConfig.color,
        originalStyleColor: layer.style?.color,
        newStyleColor: layoutConfig.color
      });
    }

    // ✅ DEBUG: Check if color is being reset when switching away from frame10
    if (frameId !== 'frame10' && !layoutConfig.color && originalLayers && layer.style?.color) {
      const originalColor = originalLayers.find((l: any) => l.id === layer.id)?.style?.color;
      if (originalColor && layer.style.color !== originalColor) {
        console.log(`🔄 [COLOR RESET DEBUG] Resetting color for ${layer.fieldType}:`, {
          fieldType: layer.fieldType,
          frameId,
          currentColor: layer.style.color,
          originalColor: originalColor
        });
      }
    }

    return updatedLayer;
  });

  return updatedLayers;
};
