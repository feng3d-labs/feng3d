module feng3d {

	/**
	 * 拥有名字的对象
	 * @author feng 2014-5-7
	 */
    export class NamedAsset {
        private static nameDic = {};

        private _asset: IAsset;
        public _assetType: string;
        private _name: string;
		/**
		 * 创建一个拥有名字的对象
		 */
        constructor(asset: IAsset, assetType: string) {
            this._asset = asset;
            this._assetType = assetType;
        }

		/**
		 * 名称
		 */
        public get name(): string {
            if (!this._name) {
                var defaultName: string = ClassUtils.getDefaultName(this);
                this._name = defaultName + <number>(NamedAsset.nameDic[defaultName]);
                NamedAsset.nameDic[defaultName] = <number>(NamedAsset.nameDic[defaultName]) + 1;
            }
            return this._name;
        }

        public set name(value: string) {
            //			if (_name)
            //				throw new Error(getQualifiedClassName(this) + " -- 对象已经有名称，无法更改");
            this._name = value;
        }

		/**
		 * @inheritDoc
		 */
        public get assetType(): string {
            return this._assetType;
        }

    }
}
