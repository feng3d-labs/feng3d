

precision highp float;

uniform int u_objectID;

void main(){

    //支持 255*255*255*255 个索引
    const float invColor = 1.0/255.0;
    float temp = float(u_objectID);
    temp = floor(temp) * invColor;
    gl_FragColor.x = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.y = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.z = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.w = fract(temp);
}