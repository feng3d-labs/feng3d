module feng3d
{
    export interface IPicker
    {
        getViewCollision(x: number, y: number, view: View3D): PickingCollisionVO;
        getSceneCollision(position: Vector3D, direction: Vector3D, scene: Scene3D): PickingCollisionVO;
        onlyMouseEnabled: boolean;
        dispose();
    }
}