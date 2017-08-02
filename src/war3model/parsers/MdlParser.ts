namespace feng3d.war3
{
	/**
	 * war3的mdl文件解析
	 * @author warden_feng 2014-6-14
	 */
	// export class MdlParser extends ParserBase
	export class MdlParser
	{
		/** 字符串数据 */
		private _textData: string;

		private static VERSION_TOKEN: string = "Version";
		private static COMMENT_TOKEN: string = "//";
		private static MODEL: string = "Model";
		private static SEQUENCES: string = "Sequences";
		private static GLOBALSEQUENCES: string = "GlobalSequences";
		private static TEXTURES: string = "Textures";
		private static MATERIALS: string = "Materials";
		private static GEOSET: string = "Geoset";
		private static GEOSETANIM: string = "GeosetAnim";
		private static BONE: string = "Bone";
		private static HELPER: string = "Helper";

		/** 当前解析位置 */
		private _parseIndex = 0;
		/** 是否文件尾 */
		private _reachedEOF = false;
		/** 当前解析行号 */
		private _line = 0;
		/** 当前行的字符位置 */
		private _charLineIndex = 0;

		constructor()
		{
			// super(ParserDataFormat.PLAIN_TEXT);
		}

		public proceedParsing(_textData: string, onParseComplete: (war3Model: War3Model) => void = null)
		{
			var token: string;

			var bone: BoneObject;
			var geoset: Geoset
			var junpStr: string;

			var num = 0;
			var war3Model = new War3Model();

			this._textData = _textData;
			while (!this._reachedEOF)
			{
				//获取关键字
				token = this.getNextToken();
				switch (token)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case MdlParser.VERSION_TOKEN:
						war3Model._version = this.parseVersion();
						break;
					case MdlParser.MODEL:
						war3Model.model = this.parseModel();
						break;
					case MdlParser.SEQUENCES:
						war3Model.sequences = this.parseSequences();
						break;
					case MdlParser.GLOBALSEQUENCES:
						war3Model.globalsequences = this.parseGlobalsequences();
						break;
					case MdlParser.TEXTURES:
						war3Model.textures = this.parseTextures();
						break;
					case MdlParser.MATERIALS:
						war3Model.materials = this.parseMaterials();
						break;
					case MdlParser.GEOSET:
						geoset = this.parseGeoset();
						war3Model.geosets.push(geoset);
						break;
					case MdlParser.GEOSETANIM:
						this.parseGeosetanim();
						break;
					case MdlParser.BONE:
						bone = this.parseBone();
						war3Model.bones[bone.ObjectId] = bone;
						break;
					case MdlParser.HELPER:
						bone = this.parseHelper();
						war3Model.bones[bone.ObjectId] = bone;
						break;
					case "PivotPoints":
						war3Model.pivotPoints = this.parsePivotPoints();
						break;
					case "ParticleEmitter2":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "EventObject":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "Attachment":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "RibbonEmitter":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "CollisionShape":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "Camera":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					case "Light":
						this.parseLiteralString();
						junpStr = this.jumpChunk();
						break;
					default:
						if (!this._reachedEOF)
							this.sendUnknownKeywordError(token);
				}
			}
			onParseComplete && onParseComplete(war3Model);
		}

		/**
		 * 获取骨骼深度
		 * @param bone
		 * @param bones
		 * @return
		 */
		private getBoneDepth(bone: BoneObject, bones: BoneObject[]): number
		{
			if (bone.Parent == -1)
				return 0;
			return this.getBoneDepth(bones[bone.Parent], bones) + 1;
		}

		/**
		 * 解析版本号
		 */
		private parseVersion()
		{
			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			token = this.getNextToken();
			if (token != "FormatVersion")
				this.sendUnknownKeywordError(token);

			var version = this.getNextInt();

			token = this.getNextToken();

			if (token != "}")
				this.sendParseError(token);
			return version;
		}

		/**
		 * 解析模型数据统计结果
		 */
		private parseModel(): Model
		{
			var model: Model = new Model();

			model.name = this.parseLiteralString();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "BlendTime":
						model.BlendTime = this.getNextInt();
						break;
					case "MinimumExtent":
						model.MinimumExtent = this.parseVector3D();
						break;
					case "MaximumExtent":
						model.MaximumExtent = this.parseVector3D();
						break;
					case "}":
						break;
					default:
						this.ignoreLine();
						break;
				}
			}
			return model;
		}

		/**
		 * 解析动作序列
		 */
		private parseSequences(): AnimInfo[]
		{
			//跳过动作个数
			this.getNextInt();
			var sequences: AnimInfo[] = [];

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Anim":
						var anim: AnimInfo = this.parseAnim();
						sequences.push(anim);
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return sequences;
		}

		/**
		 * 解析全局序列
		 */
		private parseGlobalsequences(): Globalsequences
		{
			var globalsequences: Globalsequences = new Globalsequences();

			globalsequences.id = this.getNextInt();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Duration":
						var duration: number = this.getNextInt();
						globalsequences.durations.push(duration);
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return globalsequences;
		}

		/**
		 * 解析纹理列表
		 */
		private parseTextures(): FBitmap[]
		{
			//跳过纹理个数
			this.getNextInt();
			var bitmaps: FBitmap[] = [];

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Bitmap":
						var bitmap: FBitmap = this.parseBitmap();
						bitmaps.push(bitmap);
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return bitmaps;
		}

		/**
		 * 解析材质
		 */
		private parseMaterials(): Material[]
		{
			//跳过纹理个数
			this.getNextInt();
			var materials: Material[] = [];

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Material":
						var material: Material = this.parseMaterial();
						materials.push(material);
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return materials;
		}

		private parseGeoset(): Geoset
		{
			var geoset: Geoset = new Geoset();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Vertices":
						geoset.Vertices = this.parseVertices();
						break;
					case "Normals":
						geoset.Normals = this.parseNormals();
						break;
					case "TVertices":
						geoset.TVertices = this.parseTVertices();
						break;
					case "VertexGroup":
						geoset.VertexGroup = this.parseVertexGroup();
						break;
					case "Faces":
						geoset.Faces = this.parseFaces();
						break;
					case "Groups":
						geoset.Groups = this.parseGroups();
						break;
					case "MinimumExtent":
						geoset.MinimumExtent = this.parseVector3D();
						break;
					case "MaximumExtent":
						geoset.MaximumExtent = this.parseVector3D();
						break;
					case "BoundsRadius":
						geoset.BoundsRadius = this.getNextNumber();
						break;
					case "Anim":
						var anim: AnimInfo1 = this.parseAnim1();
						geoset.Anims.push(anim);
						break;
					case "MaterialID":
						geoset.MaterialID = this.getNextInt();
						break;
					case "SelectionGroup":
						geoset.SelectionGroup = this.getNextInt();
						break;
					case "Unselectable":
						geoset.Unselectable = true;
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return geoset;
		}

		/**
		 * 解析骨骼动画
		 */
		private parseBone(): BoneObject
		{
			var bone: BoneObject = new BoneObject();
			bone.type = "bone";

			bone.name = this.parseLiteralString();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "ObjectId":
						bone.ObjectId = this.getNextInt();
						break;
					case "Parent":
						bone.Parent = this.getNextInt();
						break;
					case "GeosetId":
						bone.GeosetId = this.getNextToken();
						break;
					case "GeosetAnimId":
						bone.GeosetAnimId = this.getNextToken();
						break;
					case "Billboarded":
						bone.Billboarded = true;
						break;
					case "Translation":
						this.parseBoneTranslation(bone.Translation);
						break;
					case "Scaling":
						this.parseBoneScaling(bone.Scaling);
						break;
					case "Rotation":
						this.parseBoneRotation(bone.Rotation);
						break;
					case "BillboardedLockZ":
						break;
					case "BillboardedLockY":
						break;
					case "BillboardedLockX":
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return bone;
		}

		/**
		 * 解析骨骼动画
		 */
		private parseHelper(): BoneObject
		{
			var bone: BoneObject = new BoneObject();
			bone.type = "helper";

			bone.name = this.parseLiteralString();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "ObjectId":
						bone.ObjectId = this.getNextInt();
						break;
					case "Parent":
						bone.Parent = this.getNextInt();
						break;
					case "GeosetId":
						bone.GeosetId = this.getNextToken();
						break;
					case "GeosetAnimId":
						bone.GeosetAnimId = this.getNextToken();
						break;
					case "Billboarded":
						bone.Billboarded = true;
						break;
					case "Translation":
						this.parseBoneTranslation(bone.Translation);
						break;
					case "Scaling":
						this.parseBoneScaling(bone.Scaling);
						break;
					case "Rotation":
						this.parseBoneRotation(bone.Rotation);
						break;
					case "BillboardedLockX":
						break;
					case "BillboardedLockY":
						break;
					case "BillboardedLockZ":
						break;
					case "DontInherit":
						this.jumpChunk();
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return bone;
		}

		/**
		 * 解析骨骼角度
		 */
		private parseBoneScaling(boneScaling: BoneScaling): void
		{
			//跳过长度
			var len: number = this.getNextInt();

			this.check("{");
			boneScaling.type = this.getNextToken();

			var currentIndex: number = this._parseIndex;
			var token: string = this.getNextToken();
			if (token == "GlobalSeqId")
			{
				boneScaling.GlobalSeqId = this.getNextInt();
			}
			else
			{
				this._parseIndex = currentIndex;
			}

			var i: number = 0;
			var scaling: Scaling;
			switch (boneScaling.type)
			{
				case "Hermite":
				case "Bezier":
					for (i = 0; i < len; i++)
					{
						scaling = new Scaling();
						scaling.time = this.getNextInt();
						scaling.value = this.parseVector3D();
						scaling[this.getNextToken()] = this.parseVector3D();
						scaling[this.getNextToken()] = this.parseVector3D();
						boneScaling.scalings.push(scaling);
					}
					break;
				case "Linear":
					for (i = 0; i < len; i++)
					{
						scaling = new Scaling();
						scaling.time = this.getNextInt();
						scaling.value = this.parseVector3D();
						boneScaling.scalings.push(scaling);
					}
					break;
				case "DontInterp":
					for (i = 0; i < len; i++)
					{
						scaling = new Scaling();
						scaling.time = this.getNextInt();
						scaling.value = this.parseVector3D();
						boneScaling.scalings.push(scaling);
					}
					break;
				default:
					throw new Error("未处理" + boneScaling.type + "类型角度");
			}
			this.check("}");

		}

		/**
		 * 解析骨骼角度
		 */
		private parseBoneTranslation(boneTranslation: BoneTranslation): void
		{
			//跳过长度
			var len: number = this.getNextInt();

			this.check("{");
			boneTranslation.type = this.getNextToken();

			var currentIndex: number = this._parseIndex;
			var token: string = this.getNextToken();
			if (token == "GlobalSeqId")
			{
				boneTranslation.GlobalSeqId = this.getNextInt();
			}
			else
			{
				this._parseIndex = currentIndex;
			}

			var i: number = 0;
			var translation: Translation;
			switch (boneTranslation.type)
			{
				case "Hermite":
				case "Bezier":
					for (i = 0; i < len; i++)
					{
						translation = new Translation();
						translation.time = this.getNextInt();
						translation.value = this.parseVector3D();
						translation[this.getNextToken()] = this.parseVector3D();
						translation[this.getNextToken()] = this.parseVector3D();
						boneTranslation.translations.push(translation);
					}
					break;
				case "Linear":
					for (i = 0; i < len; i++)
					{
						translation = new Translation();
						translation.time = this.getNextInt();
						translation.value = this.parseVector3D();
						boneTranslation.translations.push(translation);
					}
					break;
				case "DontInterp":
					for (i = 0; i < len; i++)
					{
						translation = new Translation();
						translation.time = this.getNextInt();
						translation.value = this.parseVector3D();
						boneTranslation.translations.push(translation);
					}
					break;
				default:
					throw new Error("未处理" + boneTranslation.type + "类型角度");
			}
			this.check("}");

		}

		/**
		 * 解析骨骼角度
		 */
		private parseBoneRotation(boneRotation: BoneRotation): void
		{
			var len: number = this.getNextInt();

			this.check("{");
			boneRotation.type = this.getNextToken();

			var currentIndex: number = this._parseIndex;
			var token: string = this.getNextToken();
			if (token == "GlobalSeqId")
			{
				boneRotation.GlobalSeqId = this.getNextInt();
			}
			else
			{
				this._parseIndex = currentIndex;
			}

			var i: number = 0;
			var rotation: Rotation;
			switch (boneRotation.type)
			{
				case "Hermite":
				case "Bezier":
					for (i = 0; i < len; i++)
					{
						rotation = new Rotation();
						rotation.time = this.getNextInt();
						rotation.value = this.parseVector3D4();
						rotation[this.getNextToken()] = this.parseVector3D4();
						rotation[this.getNextToken()] = this.parseVector3D4();
						boneRotation.rotations.push(rotation);
					}
					break;
				case "Linear":
					for (i = 0; i < len; i++)
					{
						rotation = new Rotation();
						rotation.time = this.getNextInt();
						rotation.value = this.parseVector3D4();
						boneRotation.rotations.push(rotation);
					}
					break;
				case "DontInterp":
					for (i = 0; i < len; i++)
					{
						rotation = new Rotation();
						rotation.time = this.getNextInt();
						rotation.value = this.parseVector3D4();
						boneRotation.rotations.push(rotation);
					}
					break;
				default:
					throw new Error("未处理" + boneRotation.type + "类型角度");
			}
			this.check("}");

		}

		/**
		 * 解析多边形动画
		 */
		private parseGeosetanim(): GeosetAnim
		{
			var jumpStr: string = this.jumpChunk();

			return null;

			// if (this.war3Model.geosetAnims == null)
			// 	this.war3Model.geosetAnims = [];
			// var geosetAnim: GeosetAnim = new GeosetAnim();
			// this.war3Model.geosetAnims.push(geosetAnim);

			// var token: string = this.getNextToken();

			// if (token != "{")
			// 	this.sendParseError(token);

			// var ch: string;
			// while (ch != "}")
			// {
			// 	ch = this.getNextToken();
			// 	switch (ch)
			// 	{
			// 		case MdlParser.COMMENT_TOKEN:
			// 			this.ignoreLine();
			// 			break;
			// 		case "Alpha":
			// 			//						parseAnimAlpha();
			// 			break;
			// 		case "}":
			// 			break;
			// 		default:
			// 			this.sendUnknownKeywordError(ch);
			// 			break;
			// 	}
			// }
			// return geosetAnim;
		}

		/**
		 * 解析顶点
		 */
		private parseVertices(): number[]
		{
			var vertices: number[] = [];

			//跳过长度
			var len: number = this.getNextInt();
			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var vertex: Vector3D;
			for (var i: number = 0; i < len; i++)
			{
				vertex = this.parseVector3D();
				vertices.push(vertex.x, vertex.y, vertex.z);
			}

			token = this.getNextToken();
			if (token != "}")
				this.sendParseError(token);

			return vertices;
		}

		/**
		 * 解析法线
		 */
		private parseNormals(): number[]
		{
			var normals: number[] = [];

			//跳过长度
			var len: number = this.getNextInt();
			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var vertex: Vector3D;
			for (var i: number = 0; i < len; i++)
			{
				vertex = this.parseVector3D();
				normals.push(vertex.x, vertex.y, vertex.z);
			}

			token = this.getNextToken();
			if (token != "}")
				this.sendParseError(token);

			return normals;
		}

		/**
		 * 解析纹理坐标
		 */
		private parseTVertices(): number[]
		{
			var tVertices: number[] = [];

			//跳过长度
			var len: number = this.getNextInt();
			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var uv: Point;
			for (var i: number = 0; i < len; i++)
			{
				uv = this.parsePoint();
				tVertices.push(uv.x, uv.y);
			}

			token = this.getNextToken();
			if (token != "}")
				this.sendParseError(token);

			return tVertices;
		}

		/**
		 * 解析顶点分组
		 */
		private parseVertexGroup(): number[]
		{
			var vertexGroup: number[] = [];

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			token = this.getNextToken();
			while (token != "}")
			{
				vertexGroup.push(Number(token));
				token = this.getNextToken();
			}

			return vertexGroup;
		}

		/**
		 * 解析面
		 */
		private parseFaces(): number[]
		{
			var faces: number[] = [];

			var faceNum: number = this.getNextInt();
			var indexNum: number = this.getNextInt();

			var token: string;

			this.check("{");
			this.check("Triangles");
			this.check("{");
			this.check("{");

			token = this.getNextToken();
			while (token != "}")
			{
				faces.push(Number(token));
				token = this.getNextToken();
			}

			this.check("}");
			this.check("}");

			return faces;
		}

		/**
		 * 解顶点分组
		 */
		private parseGroups(): number[][]
		{
			var groups: number[][] = [];

			var groupNum: number = this.getNextInt();
			var valueNum: number = this.getNextInt();

			var token: string;

			this.check("{");

			token = this.getNextToken();
			while (token != "}")
			{
				if (token == "Matrices")
				{
					this.check("{");
					token = this.getNextToken();
					var Matrices: number[] = [];
					while (token != "}")
					{
						Matrices.push(Number(token));
						token = this.getNextToken();
					}
					groups.push(Matrices);
				}
				token = this.getNextToken();
			}
			return groups;
		}

		/**
		 * 解析纹理
		 */
		private parseBitmap(): FBitmap
		{
			var bitmap: FBitmap = new FBitmap();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Image":
						bitmap.image = this.parseLiteralString();
						break;
					case "ReplaceableId":
						bitmap.ReplaceableId = this.getNextInt();
						break;
					case "WrapWidth":
						break;
					case "WrapHeight":
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return bitmap;
		}

		/**
		 * 解析材质
		 */
		private parseMaterial(): Material
		{
			var material: Material = new Material();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Layer":
						var layer: Layer = this.parseLayer();
						material.layers.push(layer);
						break;
					case "SortPrimsFarZ":
						break;
					case "ConstantColor":
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return material;
		}

		/**
		 * 解析材质层
		 */
		private parseLayer(): Layer
		{
			var layer: Layer = new Layer();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var staticSigned: boolean = false;
			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "FilterMode":
						layer.FilterMode = this.getNextToken();
						break;
					case "static":
						staticSigned = true;
						break;
					case "TextureID":
						if (staticSigned)
						{
							layer.TextureID = this.getNextInt();
						}
						else
						{
							this.sendUnknownKeywordError(ch);
						}
						staticSigned = false;
						break;
					case "Alpha":
						if (staticSigned)
						{
							layer.Alpha = this.getNextNumber();
						}
						else
						{
							this.getNextInt();
							this.jumpChunk();

							//							sendUnknownKeywordError(ch);
						}
						staticSigned = false;
						break;
					case "Unshaded":
						layer.Unshaded = true;
						break;
					case "Unfogged":
						layer.Unfogged = true;
						break;
					case "TwoSided":
						layer.TwoSided = true;
						break;
					case "SphereEnvMap":
						layer.SphereEnvMap = true;
						break;
					case "NoDepthTest":
						layer.NoDepthTest = true;
						break;
					case "NoDepthSet":
						layer.NoDepthSet = true;
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return layer;
		}

		/**
		 * 解析动作信息
		 */
		private parseAnim(): AnimInfo
		{
			var anim: AnimInfo = new AnimInfo();

			anim.name = this.parseLiteralString();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "Interval":
						anim.interval = this.parseInterval();
						break;
					case "MinimumExtent":
						anim.MinimumExtent = this.parseVector3D();
						break;
					case "MaximumExtent":
						anim.MaximumExtent = this.parseVector3D();
						break;
					case "BoundsRadius":
						anim.BoundsRadius = this.getNextNumber();
						break;
					case "Rarity":
						anim.Rarity = this.getNextNumber();
						break;
					case "NonLooping":
						anim.loop = false;
						break;
					case "MoveSpeed":
						anim.MoveSpeed = this.getNextNumber();
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return anim;
		}

		/**
		 * 解析几何体动作信息
		 */
		private parseAnim1(): AnimInfo1
		{
			var anim: AnimInfo1 = new AnimInfo1();

			var token: string = this.getNextToken();

			if (token != "{")
				this.sendParseError(token);

			var ch: string;
			while (ch != "}")
			{
				ch = this.getNextToken();
				switch (ch)
				{
					case MdlParser.COMMENT_TOKEN:
						this.ignoreLine();
						break;
					case "MinimumExtent":
						anim.MinimumExtent = this.parseVector3D();
						break;
					case "MaximumExtent":
						anim.MaximumExtent = this.parseVector3D();
						break;
					case "BoundsRadius":
						anim.BoundsRadius = this.getNextNumber();
						break;
					case "}":
						break;
					default:
						this.sendUnknownKeywordError(ch);
						break;
				}
			}
			return anim;
		}

		/**
		 * 解析骨骼轴心坐标
		 */
		private parsePivotPoints(): Vector3D[]
		{
			var points: Vector3D[] = [];

			var len: number = this.getNextInt();

			this.check("{");

			for (var i: number = 0; i < len; i++)
			{
				var point: Vector3D = this.parseVector3D();
				points.push(point);
			}

			this.check("}");

			return points;
		}

		/**
		 * 解析3d向量
		 */
		private parseVector3D(): Vector3D
		{
			var vec: Vector3D = new Vector3D();
			var ch: string = this.getNextToken();

			if (ch != "{")
				this.sendParseError("{");
			vec.x = this.getNextNumber();
			vec.y = this.getNextNumber();
			vec.z = this.getNextNumber();

			ch = this.getNextToken();
			if (!(ch == "}" || ch == "},"))
				this.sendParseError("}");

			return vec;
		}

		/**
		 * 解析四元素
		 */
		private parseVector3D4(): Quaternion
		{
			var vec: Quaternion = new Quaternion();
			var ch: string = this.getNextToken();

			if (ch != "{")
				this.sendParseError("{");
			vec.x = this.getNextNumber();
			vec.y = this.getNextNumber();
			vec.z = this.getNextNumber();
			vec.w = this.getNextNumber();

			ch = this.getNextToken();
			if (!(ch == "}" || ch == "},"))
				this.sendParseError("}");

			return vec;
		}

		/**
		 * 解析2d坐标
		 */
		private parsePoint(): Point
		{
			var point: Point = new Point();
			var ch: string = this.getNextToken();

			if (ch != "{")
				this.sendParseError("{");
			point.x = this.getNextNumber();
			point.y = this.getNextNumber();

			ch = this.getNextToken();
			if (!(ch == "}" || ch == "},"))
				this.sendParseError("}");

			return point;
		}

		/**
		 * 解析间隔
		 */
		private parseInterval(): Interval
		{
			var interval: Interval = new Interval();
			var ch: string = this.getNextToken();

			if (ch != "{")
				this.sendParseError("{");
			interval.start = this.getNextInt();
			interval.end = this.getNextInt();

			ch = this.getNextToken();
			if (!(ch == "}" || ch == "},"))
				this.sendParseError("}");

			return interval;
		}

		/**
		 * 解析带双引号的字符串
		 */
		private parseLiteralString(): string
		{
			this.skipWhiteSpace();

			var ch: string = this.getNextChar();
			var str: string = "";

			if (ch != "\"")
				this.sendParseError("\"");

			do
			{
				if (this._reachedEOF)
					this.sendEOFError();
				ch = this.getNextChar();
				if (ch != "\"")
					str += ch;
			} while (ch != "\"");

			return str;
		}

		/**
		 * 读取下个Number
		 */
		private getNextNumber(): number
		{
			var f: number = parseFloat(this.getNextToken());
			if (isNaN(f))
				this.sendParseError("float type");
			return f;
		}

		/**
		 * 读取下个字符
		 */
		private getNextChar(): string
		{
			var ch: string = this._textData.charAt(this._parseIndex++);

			if (ch == "\n")
			{
				++this._line;
				this._charLineIndex = 0;
			}
			else if (ch != "\r")
				++this._charLineIndex;

			if (this._parseIndex >= this._textData.length)
				this._reachedEOF = true;

			return ch;
		}

		/**
		 * 读取下个int
		 */
		private getNextInt(): number
		{
			var i: number = parseInt(this.getNextToken());
			if (isNaN(i))
				this.sendParseError("int type");
			return i;
		}

		/**
		 * 获取下个关键字
		 */
		private getNextToken(): string
		{
			var ch: string;
			var token: string = "";

			while (!this._reachedEOF)
			{
				ch = this.getNextChar();
				if (ch == " " || ch == "\r" || ch == "\n" || ch == "\t" || ch == ",")
				{
					if (token != MdlParser.COMMENT_TOKEN)
						this.skipWhiteSpace();
					if (token != "")
						return token;
				}
				else
					token += ch;

				if (token == MdlParser.COMMENT_TOKEN)
					return token;
			}

			return token;
		}

		/**
		 * 跳过块
		 * @return 跳过的内容
		 */
		private jumpChunk(): string
		{
			var start: number = this._parseIndex;

			this.check("{");
			var stack = ["{"];

			var ch: string;

			while (!this._reachedEOF)
			{
				ch = this.getNextChar();
				if (ch == "{")
				{
					stack.push("{");
				}
				if (ch == "}")
				{
					stack.pop();
					if (stack.length == 0)
					{
						return this._textData.substring(start, this._parseIndex);
					}
				}
			}

			return null;
		}

		/**
		 * 返回到上个字符位置
		 */
		private putBack(): void
		{
			this._parseIndex--;
			this._charLineIndex--;
			this._reachedEOF = this._parseIndex >= this._textData.length;
		}

		/**
		 * 跳过空白
		 */
		private skipWhiteSpace(): void
		{
			var ch: string;

			do
				ch = this.getNextChar();
			while (ch == "\n" || ch == " " || ch == "\r" || ch == "\t");

			this.putBack();
		}

		/**
		 * 忽略该行
		 */
		private ignoreLine(): void
		{
			var ch: string;
			while (!this._reachedEOF && ch != "\n")
				ch = this.getNextChar();
		}

		private check(key: string): void
		{
			var token: string = this.getNextToken();
			if (token != key)
				this.sendParseError(token);
		}

		/**
		 * 抛出一个文件尾过早结束文件时遇到错误
		 */
		private sendEOFError(): void
		{
			throw new Error("Unexpected end of file");
		}

		/**
		 * 遇到了一个意想不到的令牌时将抛出一个错误。
		 * @param expected 发生错误的标记
		 */
		private sendParseError(expected: string): void
		{
			throw new Error("Unexpected token at line " + (this._line + 1) + ", character " + this._charLineIndex + ". " + expected + " expected, but " + this._textData.charAt(this._parseIndex - 1) + " encountered");
		}

		/**
		 * 发生未知关键字错误
		 */
		private sendUnknownKeywordError(keyword: string): void
		{
			throw new Error("Unknown keyword[" + keyword + "] at line " + (this._line + 1) + ", character " + this._charLineIndex + ". ");
		}
	}
}

