precision mediump float;

varying vec2 vUv;
varying vec3 vNormal;
  
uniform sampler2D texture;
  
void main () {
  vec3 tex = texture2D(texture, vUv*1.0).xyz;
  vec3 lightDir = normalize(vec3(0.4, 0.9, 0.3));
  
  vec3 n = vNormal;
  
  // for the back faces we need to use the opposite normals.
  if(gl_FrontFacing == false) {
    n = -n;
  }
  
  vec3 ambient = 0.3 * tex;
  vec3 diffuse = 0.7 * tex * clamp( dot(n, lightDir ), 0.0, 1.0 );
  
  gl_FragColor = vec4(ambient + diffuse, 1.0);
}