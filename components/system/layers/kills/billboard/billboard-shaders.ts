export const billboardPositionGLSL = `
    vec4 viewCenter = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float scale = length(instanceMatrix[0].xyz);
    viewCenter.xy += position.xy * scale;
    gl_Position = projectionMatrix * viewCenter;
`;

export const discAlphaGLSL = `
    vec2 centered = vUv * 2.0 - 1.0;
    float d = length(centered);
    if (d > 1.0)
        discard;
    float alpha = 1.0 - smoothstep(0.7, 1.0, d);
`;
