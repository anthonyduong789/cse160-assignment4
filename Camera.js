class Camera {
  constructor() {
    this.fov = 60;
    // NOTE: eye controls the view in the persective as it relates to the object
    this.eye = new Vector3([0, 0.2, 5]);
    this.at = new Vector3([0, 1, -100]);
    this.up = new Vector3([0, 0.3, 0]);
    this.viewMat = new Matrix4();
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
    this.projMat = new Matrix4();
    this.projMat.setPerspective(50, canvas.width / canvas.height, 0.1, 1000);
  }

  forward() {
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    f = f.normalize();
    this.at = this.at.add(f.mul(0.5));
    this.eye = this.eye.add(f.mul(0.5));
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  back() {
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    f = f.normalize();
    this.at = this.at.sub(f.mul(0.5));
    this.eye = this.eye.sub(f.mul(0.5));
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  right() {
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    var s = new Vector3([0, 0, 0]);
    s.set(f);
    s = Vector3.cross(f, this.up);
    s = s.normalize();
    this.at = this.at.add(s.mul(0.5));
    this.eye = this.eye.add(s.mul(0.5));
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  left() {
    var f = new Vector3([0, 0, 0]);
    f.set(this.eye);
    f.sub(this.at);
    var s = new Vector3([0, 0, 0]);
    s.set(f);
    s = Vector3.cross(f, this.up);
    s = s.normalize();
    this.at = this.at.add(s.mul(0.5));
    this.eye = this.eye.add(s.mul(0.5));
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }
  // NOTE: lets the user go up or down
  cameraYaxis(input) {
    var f = new Vector3([0, input, 0]);
    this.eye.add(f);
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  panLeft(number) {
    if (!number) {
      number = 10;
    }
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      number,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    );
    var f_prime = new Vector3([0, 0, 0]);
    f_prime = rotationMatrix.multiplyVector3(f);
    var tempEye = new Vector3([0, 0, 0]);
    tempEye.set(this.eye);
    this.at = tempEye.add(f_prime);
    // console.log(this.at.elements[1]);
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  panRight(number) {
    if (!number) {
      number = -10;
    }
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      number,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    );
    var f_prime = new Vector3([0, 0, 0]);
    f_prime = rotationMatrix.multiplyVector3(f);
    var tempEye = new Vector3([0, 0, 0]);
    tempEye.set(this.eye);
    this.at = tempEye.add(f_prime);
    // console.log(this.at.elements[1]);
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }

  panMLeft(deg) {
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      deg,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    );
    var f_prime = new Vector3([0, 0, 0]);
    f_prime = rotationMatrix.multiplyVector3(f);
    var tempEye = new Vector3([0, 0, 0]);
    tempEye.set(this.eye);
    this.at = tempEye.add(f_prime);
    // console.log(this.at.elements[1]);
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }
  panY(number) {
    var f = new Vector3([0, number, 0]);
    this.at.add(f);
    // f.set(this.at.elements[0], this.at.elements[1] + 1, this.at.elements[2]);
    // this.at = f;
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    );
    // // (eye, at, up)
  }

  panMRight(deg) {
    var f = new Vector3([0, 0, 0]);
    f.set(this.at);
    f.sub(this.eye);
    var rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      deg,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    );
    var f_prime = new Vector3([0, 0, 0]);
    f_prime = rotationMatrix.multiplyVector3(f);
    var tempEye = new Vector3([0, 0, 0]);
    tempEye.set(this.eye);
    this.at = tempEye.add(f_prime);
    // console.log(this.at.elements[1]);
    this.viewMat.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2],
    ); // (eye, at, up)
  }
}
