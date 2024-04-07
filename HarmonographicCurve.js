import * as THREE from 'three';

// constructor for Harmonograph curve
class HarmonographicCurve extends THREE.Curve{
    constructor(Ax, Ay, Az, wx, wy, wz, px, py, pz){
        super();
        this.Ax = Ax;
        this.Ay = Ay;
        this.Az = Az;
        this.wx = wx;
        this.wy = wy;
        this.wz = wz;
        this.px = px;
        this.py = py;
        this.pz = pz;
    }
    getPoint(t){
        //since three uses a range of t=0..1, for frequency you will need a factor of 2pi
        var x  = this.Ax * Math.sin(this.wx*t*2*Math.PI + this.px)
        var y = this.Ay * Math.sin(this.wy*t*2*Math.PI + this.py) + 5 ;
        var z = this.Az*Math.sin(this.wz*2*t*Math.PI + this.pz);
        return new THREE.Vector3(x, y, z);
    }
}

export default HarmonographicCurve; 