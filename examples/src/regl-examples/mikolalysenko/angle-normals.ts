function hypot(x, y, z)
{
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
}

function weight(s, r, a)
{
    return Math.atan2(r, (s - a));
}

function mulAdd(dest, s, x, y, z)
{
    dest[0] += s * x;
    dest[1] += s * y;
    dest[2] += s * z;
}

export function angleNormals(cells, positions)
{
    const numVerts = positions.length;
    const numCells = cells.length;

    // Allocate normal array
    const normals = new Array(numVerts);
    for (let i = 0; i < numVerts; ++i)
    {
        normals[i] = [0, 0, 0];
    }

    // Scan cells, and
    for (let i = 0; i < numCells; ++i)
    {
        const cell = cells[i];
        const a = positions[cell[0]];
        const b = positions[cell[1]];
        const c = positions[cell[2]];

        const abx = a[0] - b[0];
        const aby = a[1] - b[1];
        const abz = a[2] - b[2];
        const ab = hypot(abx, aby, abz);

        const bcx = b[0] - c[0];
        const bcy = b[1] - c[1];
        const bcz = b[2] - c[2];
        const bc = hypot(bcx, bcy, bcz);

        const cax = c[0] - a[0];
        const cay = c[1] - a[1];
        const caz = c[2] - a[2];
        const ca = hypot(cax, cay, caz);

        if (Math.min(ab, bc, ca) < 1e-6)
        {
            continue;
        }

        const s = 0.5 * (ab + bc + ca);
        const r = Math.sqrt((s - ab) * (s - bc) * (s - ca) / s);

        let nx = aby * bcz - abz * bcy;
        let ny = abz * bcx - abx * bcz;
        let nz = abx * bcy - aby * bcx;
        const nl = hypot(nx, ny, nz);
        nx /= nl;
        ny /= nl;
        nz /= nl;

        mulAdd(normals[cell[0]], weight(s, r, bc), nx, ny, nz);
        mulAdd(normals[cell[1]], weight(s, r, ca), nx, ny, nz);
        mulAdd(normals[cell[2]], weight(s, r, ab), nx, ny, nz);
    }

    // Normalize all the normals
    for (let i = 0; i < numVerts; ++i)
    {
        const n = normals[i];
        const l = Math.sqrt(
            Math.pow(n[0], 2)
            + Math.pow(n[1], 2)
            + Math.pow(n[2], 2));
        if (l < 1e-8)
        {
            n[0] = 1;
            n[1] = 0;
            n[2] = 0;
            continue;
        }
        n[0] /= l;
        n[1] /= l;
        n[2] /= l;
    }

    return normals;
}
