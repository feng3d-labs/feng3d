export { };

declare global
{
    interface MixinsOAVComponentParamMap
    {
        OAVComponentList: { component: 'OAVComponentList', componentParam: Object };
        OAVEntityName: { component: 'OAVEntityName', componentParam: Object };
    }
}
