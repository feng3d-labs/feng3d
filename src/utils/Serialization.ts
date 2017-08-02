namespace feng3d
{
    /**
     * 数据序列化
     * @author feng 2017-03-11
     */
    export class Serialization
    {
        static serialize(object: any, data?: any): any
        {
            if (!data)
            {
                data = {};
            }

            var serializableMembers: string[] = object.__serializableMembers;
            if (serializableMembers)
            {
                let property: string;
                for (var i = 0, n = serializableMembers.length; i < n; i++)
                {
                    property = serializableMembers[i]
                    if (object.hasOwnProperty(property))
                        data[property] = object[property];
                }
            }

            return data;
        }

        static deserialize(data: any, object?: any): any
        {
            if (!object)
            {
                object = {};
            }

            var serializableMembers: string[] = data.__serializableMembers;
            if (serializableMembers)
            {
                let property: string;
                for (var i = 0, n = serializableMembers.length; i < n; i++)
                {
                    property = serializableMembers[i]
                    object[property] = data[property];
                }
            }
            return object;
        }
    }
}