namespace feng3d.war3
{
	/**
	 *
	 * @author warden_feng 2014-6-28
	 */
	export class War3Utils
	{
		/**
		 * 本函数用下面的公式计算变换矩阵：Mout = (Msc)-1 * (Msr)-1 * Ms * Msr * Msc * (Mrc)-1 * Mr * Mrc * Mt
		 * 参考地址：http://blog.csdn.net/caimouse/article/details/132051;http://msdn.microsoft.com/en-us/library/windows/desktop/bb205365(v=vs.85).aspx
		 * @param pScalingCenter	指向D3DXVECTOR3 结构的缩放中心点向量。如果为NULL，Msc 矩阵就是单位矩阵。
		 * @param pScalingRotation	指向D3DXQUATERNION 结构的缩放和旋转的四元组。如果参数为NULL，Msr 矩阵就是单位矩阵。
		 * @param pScaling			指向D3DXVECTOR3 结构的缩放向量。如果参数为NULL，Ms 矩阵就是单位矩阵。
		 * @param pRotationCenter	指向D3DXVECTOR3 结构的旋转中心向量。如果参数为NULL，Mrc 矩阵是单位矩阵。
		 * @param pRotation			指向D3DXQUATERNION 结构的旋转的四元组。如果参数为NULL，Mr 矩阵就是单位矩阵。
		 * @param pTranslation		指向D3DXVECTOR3 结构的平移向量。如果参数是NULL，Mt 矩阵就是单位矩阵。
		 * @return 指向D3DXMATRIX 结构的操作结果矩阵。
		 */
		static D3DXMatrixTransformation(pScalingCenter: Vector3D, pScalingRotation: Quaternion, pScaling: Vector3D, pRotationCenter: Vector3D, pRotation: Quaternion, pTranslation: Vector3D): Matrix3D
		{
			var msc: Matrix3D = new Matrix3D();
			if (pScalingCenter)
				msc.appendTranslation(pScalingCenter.x, pScalingCenter.y, pScalingCenter.z);
			var msc_1: Matrix3D = msc.clone();
			msc_1.invert();

			var msr: Matrix3D = new Matrix3D();
			if (pScalingRotation)
				msr = pScalingRotation.toMatrix3D();
			var msr_1: Matrix3D = msr.clone();
			msr_1.invert();

			var ms: Matrix3D = new Matrix3D();
			if (pScaling)
				ms.appendScale(pScaling.x, pScaling.y, pScaling.z);
			var ms_1: Matrix3D = ms.clone();
			ms_1.invert();

			var mrc: Matrix3D = new Matrix3D();
			if (pRotationCenter)
				mrc.appendTranslation(pRotationCenter.x, pRotationCenter.y, pRotationCenter.z);
			var mrc_1: Matrix3D = mrc.clone();
			mrc_1.invert();

			var mr: Matrix3D = new Matrix3D()
			if (pRotation)
				mr = pRotation.toMatrix3D();

			var mt: Matrix3D = new Matrix3D();
			if (pTranslation)
				mt.appendTranslation(pTranslation.x, pTranslation.y, pTranslation.z);

			var matrix3ds = [msc_1, msr_1, ms, msr, msc, mrc_1, mr, mrc, mt];

			var mout: Matrix3D = new Matrix3D();

			for (var i: number = 0; i < matrix3ds.length; i++)
			{
				mout.append(matrix3ds[i]);
			}

			return mout;
		}
	}
}


