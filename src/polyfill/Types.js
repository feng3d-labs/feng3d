var feng3d;
(function (feng3d) {
    feng3d.lazy = {
        getvalue: function (lazyItem) {
            if (typeof lazyItem == "function")
                return lazyItem();
            return lazyItem;
        }
    };
})(feng3d || (feng3d = {}));
