import { Node3D } from '../3d/core/Node3D';
import { Box3 } from '../math/geom/Box3';
import { Matrix4x4 } from '../math/geom/Matrix4x4';
import { Ray3 } from '../math/geom/Ray3';
import { Vector3 } from '../math/geom/Vector3';

/**
 * 游戏对象变换工具
 */
export class TransformUtils
{
    static moveForward(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.Z_AXIS, distance);
    }

    static moveBackward(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.Z_AXIS, -distance);
    }

    static moveLeft(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.X_AXIS, -distance);
    }

    static moveRight(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.X_AXIS, distance);
    }

    static moveUp(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.Y_AXIS, distance);
    }

    static moveDown(transform: Node3D, distance: number)
    {
        this.translateLocal(transform, Vector3.Y_AXIS, -distance);
    }

    static translate(transform: Node3D, axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        transform.x += x * len;
        transform.y += y * len;
        transform.z += z * len;
    }

    static translateLocal(transform: Node3D, axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        const matrix = transform.matrix.clone();
        matrix.prependTranslation(x * len, y * len, z * len);
        const p = matrix.getPosition();
        transform.x = p.x;
        transform.y = p.y;
        transform.z = p.z;
    }

    static pitch(transform: Node3D, angle: number)
    {
        this.rotate(transform, Vector3.X_AXIS, angle);
    }

    static yaw(transform: Node3D, angle: number)
    {
        this.rotate(transform, Vector3.Y_AXIS, angle);
    }

    static roll(transform: Node3D, angle: number)
    {
        this.rotate(transform, Vector3.Z_AXIS, angle);
    }

    static rotateTo(transform: Node3D, ax: number, ay: number, az: number)
    {
        transform.rotation.set(ax, ay, az);
    }

    /**
     * 绕指定轴旋转，不受位移与缩放影响
     * @param    axis               旋转轴
     * @param    angle              旋转角度
     * @param    pivotPoint         旋转中心点
     *
     */
    static rotate(transform: Node3D, axis: Vector3, angle: number, pivotPoint?: Vector3): void
    {
        const position = transform.position;
        const rotation = transform.rotation;

        // 转换位移
        const positionMatrix = new Matrix4x4().fromPosition(position.x, position.y, position.z);
        positionMatrix.appendRotation(axis, angle, pivotPoint);
        transform.position = positionMatrix.getPosition();
        // 转换旋转
        const rotationMatrix = new Matrix4x4().fromRotation(rotation.x, rotation.y, rotation.z);
        rotationMatrix.appendRotation(axis, angle, pivotPoint);
        const newrotation = rotationMatrix.toTRS()[1];
        const v = Math.round((newrotation.x - rotation.x) / 180);
        if (v % 2 !== 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }
        //
        const toRound = (a: number, b: number, c = 360) =>
            Math.round((b - a) / c) * c + a;
        newrotation.x = toRound(newrotation.x, rotation.x);
        newrotation.y = toRound(newrotation.y, rotation.y);
        newrotation.z = toRound(newrotation.z, rotation.z);
        transform.rotation = newrotation;
    }

    /**
     * 看向目标位置
     *
     * @param target    目标位置
     * @param upAxis    向上朝向
     */
    static lookAt(transform: Node3D, target: Vector3, upAxis?: Vector3)
    {
        const matrix = transform.matrix;
        matrix.lookAt(target, upAxis);
        transform.matrix = matrix;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     *
     * @param direction 局部空间方向
     */
    static transformDirection(transform: Node3D, direction: Vector3)
    {
        direction = this.localToWolrdDirection(transform, direction);

        return direction;
    }

    /**
     * 将方向从局部空间转换到世界空间。
     *
     * @param direction 局部空间方向
     */
    static localToWolrdDirection(transform: Node3D, direction: Vector3)
    {
        if (!transform.parent)
        {
            return direction.clone();
        }
        const matrix = transform.parent.globalRotationMatrix;
        direction = matrix.transformPoint3(direction);

        return direction;
    }

    /**
     * 将包围盒从局部空间转换到世界空间
     *
     * @param box 变换前的包围盒
     * @param out 变换之后的包围盒
     *
     * @returns 变换之后的包围盒
     */
    static localToWolrdBox(transform: Node3D, box: Box3, out = new Box3())
    {
        if (!transform.parent)
        {
            return out.copy(box);
        }
        const matrix = transform.parent.globalMatrix;
        box.applyMatrixTo(matrix, out);

        return out;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     *
     * @param position 局部空间位置
     */
    static transformPoint(transform: Node3D, position: Vector3)
    {
        position = this.localToGlobalPoint(transform, position);

        return position;
    }

    /**
     * 将位置从局部空间转换为世界空间。
     *
     * @param position 局部空间位置
     */
    static localToGlobalPoint(transform: Node3D, position: Vector3)
    {
        if (!transform.parent)
        {
            return position.clone();
        }
        position = transform.parent.globalMatrix.transformPoint3(position);

        return position;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     *
     * @param vector 局部空间向量
     */
    static transformVector(transform: Node3D, vector: Vector3)
    {
        vector = this.localToGlobalVector(transform, vector);

        return vector;
    }

    /**
     * 将向量从局部空间变换到世界空间。
     *
     * @param vector 局部空间位置
     */
    static localToGlobalVector(transform: Node3D, vector: Vector3)
    {
        if (!transform.parent)
        {
            return vector.clone();
        }
        const matrix = transform.parent.globalMatrix;
        vector = matrix.transformVector3(vector);

        return vector;
    }

    /**
     * Transforms a direction from global space to local space. The opposite of Node3D.TransformDirection.
     *
     * 将一个方向从世界空间转换到局部空间。
     */
    static inverseTransformDirection(transform: Node3D, direction: Vector3)
    {
        direction = this.globalToLocalDirection(transform, direction);

        return direction;
    }

    /**
     * 将一个方向从世界空间转换到局部空间。
     */
    static globalToLocalDirection(transform: Node3D, direction: Vector3)
    {
        if (!transform.parent)
        {
            return direction.clone();
        }
        const matrix = transform.parent.globalRotationMatrix.clone().invert();
        direction = matrix.transformPoint3(direction);

        return direction;
    }

    /**
     * 将位置从世界空间转换为局部空间。
     *
     * @param position 世界坐标系中位置
     */
    static globalToLocalPoint(transform: Node3D, position: Vector3, out = new Vector3())
    {
        if (!transform.parent)
        {
            return out.copy(position);
        }
        position = transform.parent.invertGlobalMatrix.transformPoint3(position, out);

        return position;
    }

    /**
     * 将向量从世界空间转换为局部空间
     *
     * @param vector 世界坐标系中向量
     */
    static globalToLocalVector(transform: Node3D, vector: Vector3)
    {
        if (!transform.parent)
        {
            return vector.clone();
        }
        vector = transform.parent.invertGlobalMatrix.transformVector3(vector);

        return vector;
    }

    /**
     * 将 Ray3 从世界空间转换为局部空间。
     *
     * @param globalRay 世界空间射线。
     * @param localRay 局部空间射线。
     */
    static rayGlobalToLocal(transform: Node3D, globalRay: Ray3, localRay = new Ray3())
    {
        transform.invertGlobalMatrix.transformRay(globalRay, localRay);

        return localRay;
    }
}
