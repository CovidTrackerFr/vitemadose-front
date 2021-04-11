

export class Strings {
    public static padLeft(value: number, size: number, filler: string) {
        const padSize = size - (""+value).length;
        let pad = '';
        for(var i=0; i<padSize; i += filler.length) { pad += filler; }
        return pad+value;
    }

    public static plural(value: number|null|undefined, pluralForm: string = 's') {
        return (value && value>1)?pluralForm:'';
    }

    static toNormalizedPhoneNumber(phoneNumber: string) {
        let normaliedPhoneNumber = phoneNumber;
        if(normaliedPhoneNumber.indexOf("+33") === 0) {
            normaliedPhoneNumber = `0${normaliedPhoneNumber.substring("+33".length)}`
        }
        if(normaliedPhoneNumber[2] !== " ") {
            normaliedPhoneNumber = [
                normaliedPhoneNumber[0], normaliedPhoneNumber[1], " ",
                normaliedPhoneNumber[2], normaliedPhoneNumber[3], " ",
                normaliedPhoneNumber[4], normaliedPhoneNumber[5], " ",
                normaliedPhoneNumber[6], normaliedPhoneNumber[7], " ",
                normaliedPhoneNumber[8], normaliedPhoneNumber[9]
            ].join("");
        }

        return normaliedPhoneNumber;
    }

    public static toReadableURLPathValue(value: string) {
        return value.toLowerCase()
            .replace(" ", "_")
            .replace(/[èéëêêéè]/gi, "e")
            .replace(/[áàâäãåâà]/gi, "a")
            .replace(/[çç]/gi, "c")
            .replace(/[íìîï]/gi, "i")
            .replace(/[ñ]/gi, "n")
            .replace(/[óòôöõô]/gi, "o")
            .replace(/[úùûüûù]/gi, "u")
            .replace(/[œ]/gi, "oe");
    }
}
