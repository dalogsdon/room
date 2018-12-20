(function() {
    var CHART_SIZE = 1;
    var CHART_SIZE_HALF = CHART_SIZE/2;
    var sphereRadius = 0.03;

    function clamp(number, min, max) {
        return Math.max(Math.min(number, max), min);
    }
    function colorMaterial(color) {
        return new THREE.MeshLambertMaterial({
            color: color
        });
    }
    function lineColorMaterial(color) {
        return new THREE.LineBasicMaterial({
            color: color,
            linewidth: 3
        });
    }

    AFRAME.registerComponent('test-chart', {
        schema: {
            count: { type: 'int', default: 20 },
            groundColor: { type: 'color', default: 'lightgray' },
            pointColor: { type: 'color', default: '#9999ff' },
            size: { type: 'number', default: 1 }
        },

        init: function() {
            // materials
            var groundMaterial = colorMaterial(this.data.groundColor);
            var pointMaterial = colorMaterial(this.data.pointColor);
            this.pointColor = new THREE.Color(this.data.pointColor);
            var xMaterial = lineColorMaterial('red');
            var yMaterial = lineColorMaterial('green');
            var zMaterial = lineColorMaterial('blue');

            // ground plane to block the marker
            var groundPlane = new THREE.PlaneGeometry(CHART_SIZE, CHART_SIZE);
            var groundMesh = new THREE.Mesh(groundPlane, groundMaterial);
            groundMesh.rotation.x = -Math.PI/2;

            // xyz axes
            var axisLength = CHART_SIZE;
            var axisWidth = 0.01;

            var xBox = new THREE.BoxGeometry(axisLength, axisWidth,  axisWidth);
            var yBox = new THREE.BoxGeometry(axisWidth,  axisWidth,  axisLength);
            var zBox = new THREE.BoxGeometry(axisWidth,  axisLength, axisWidth);

            var xEdges = new THREE.EdgesGeometry(xBox);
            var yEdges = new THREE.EdgesGeometry(yBox);
            var zEdges = new THREE.EdgesGeometry(zBox);

            var xAxis = new THREE.LineSegments(xEdges, xMaterial);
            var yAxis = new THREE.LineSegments(yEdges, yMaterial);
            var zAxis = new THREE.LineSegments(zEdges, zMaterial);

            xAxis.position.y = CHART_SIZE_HALF;

            yAxis.position.x = -CHART_SIZE_HALF;
            yAxis.position.y = CHART_SIZE_HALF;
            yAxis.position.z = CHART_SIZE_HALF;

            zAxis.position.x = -CHART_SIZE_HALF;

            groundMesh.add(xAxis);
            groundMesh.add(yAxis);
            groundMesh.add(zAxis);

            // randomly place some points
            var points = [];
            var pointVectors = [];
            for (var i = 0; i < this.data.count; i++) {
                // generate a random point
                var point = new THREE.Mesh(
                    new THREE.SphereGeometry(sphereRadius,16,8),
                    pointMaterial.clone()
                );
                point.position.x = Math.random() * CHART_SIZE - sphereRadius - CHART_SIZE_HALF;
                point.position.y = Math.random() * CHART_SIZE - sphereRadius - CHART_SIZE_HALF;
                point.position.z = Math.random() * CHART_SIZE - sphereRadius;
                points.push(point);
                groundMesh.add(point);

                // generate movement vectors for each point
                var vector = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize().divideScalar(5);
                pointVectors.push(vector);
            }

            this.groundPlane = groundMesh;
            this.points = points;
            this.pointVectors = pointVectors;
            this.el.setObject3D('mesh', groundMesh);
        },

        tick: function() {
            this.points.forEach(function(point, i) {
                // move each point along its vector
                point.position.x += this.pointVectors[i].x;
                point.position.y += this.pointVectors[i].y;
                point.position.z += this.pointVectors[i].z;

                var inBounds = true;

                // if point is going out of bounds, reflect it back inwards
                if (point.position.x > CHART_SIZE - sphereRadius || point.position.x < -(CHART_SIZE - sphereRadius)) {
                    inBounds = false;
                    this.pointVectors[i].x *= -1;
                    point.material.color.set('red');
                }
                if (point.position.y > CHART_SIZE - sphereRadius || point.position.y < -(CHART_SIZE - sphereRadius)) {
                    inBounds = false;
                    this.pointVectors[i].y *= -1;
                    point.material.color.set('blue');
                }
                if (point.position.z > CHART_SIZE - sphereRadius || point.position.z < sphereRadius) {
                    inBounds = false;
                    this.pointVectors[i].z *= -1;
                    point.material.color.set('green');
                }

                if (inBounds) {
                    // rotate the vector slightly to give a random path
                    var rotation = new THREE.Matrix4();
                    rotation.makeRotationFromEuler(new THREE.Euler(
                        (Math.random() - 0.5)/2,
                        (Math.random() - 0.5)/2,
                        (Math.random() - 0.5)/2
                    ));
                    this.pointVectors[i].transformDirection(rotation).divideScalar(100);
                }

                // blend the color back to original
                var rDiff = this.pointColor.r - point.material.color.r;
                var gDiff = this.pointColor.g - point.material.color.g;
                var bDiff = this.pointColor.b - point.material.color.b;

                var rMinMax = Math.sign(rDiff) == -1 ? Math.max : Math.min;
                var gMinMax = Math.sign(gDiff) == -1 ? Math.max : Math.min;
                var bMinMax = Math.sign(bDiff) == -1 ? Math.max : Math.min;

                var colorSpeed = 20;
                var rInc = rDiff / colorSpeed;
                var gInc = gDiff / colorSpeed;
                var bInc = bDiff / colorSpeed;

                point.material.color.r = rMinMax(point.material.color.r + rInc, this.pointColor.r);
                point.material.color.g = gMinMax(point.material.color.g + gInc, this.pointColor.g);
                point.material.color.b = bMinMax(point.material.color.b + bInc, this.pointColor.b);
            }, this);
        }
    });
})();
