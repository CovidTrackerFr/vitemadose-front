

export class Strings {
    public static padLeft(value: number, size: number, filler: string) {
        const padSize = (""+value).length - size;
        let pad = '';
        for(var i=0; i<padSize; i += filler.length) { pad += filler; }
        return pad+value;
    }

    public static plural(value: number|null|undefined, pluralForm: string = 's') {
        return (value && value>1)?pluralForm:'';
    }
}
