import { objectview } from 'feng3d';

//
objectview.defaultBaseObjectViewClass = 'OVBaseDefault';
objectview.defaultObjectViewClass = 'OVDefault';
objectview.defaultObjectAttributeViewClass = 'OAVDefault';
objectview.defaultObjectAttributeBlockView = 'OBVDefault';
//
objectview.setDefaultTypeAttributeView('Boolean', { component: 'OAVBoolean' });
objectview.setDefaultTypeAttributeView('String', { component: 'OAVString' });
objectview.setDefaultTypeAttributeView('number', { component: 'OAVNumber' });
objectview.setDefaultTypeAttributeView('Vector2', { component: 'OAVVector2' });
objectview.setDefaultTypeAttributeView('Vector3', { component: 'OAVVector3' });
objectview.setDefaultTypeAttributeView('Vector4', { component: 'OAVVector4' });
objectview.setDefaultTypeAttributeView('Array', { component: 'OAVArray' });
objectview.setDefaultTypeAttributeView('Function', { component: 'OAVFunction' });
objectview.setDefaultTypeAttributeView('Color3', { component: 'OAVColorPicker' });
objectview.setDefaultTypeAttributeView('Color4', { component: 'OAVColorPicker' });
objectview.setDefaultTypeAttributeView('Texture2D', { component: 'OAVTexture2D' });
objectview.setDefaultTypeAttributeView('MinMaxGradient', { component: 'OAVMinMaxGradient' });
objectview.setDefaultTypeAttributeView('MinMaxCurve', { component: 'OAVMinMaxCurve' });
objectview.setDefaultTypeAttributeView('MinMaxCurveVector3', { component: 'OAVMinMaxCurveVector3' });
    //
