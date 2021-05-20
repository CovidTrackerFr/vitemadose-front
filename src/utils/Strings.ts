
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

    // FIXME move to dedicated component
    static toNormalizedPhoneNumber(phoneNumber: string|undefined) {
        if(phoneNumber === undefined) {
            return undefined;
        }

        let normalizedPhoneNumber = phoneNumber!;
        const formatInternational = normalizedPhoneNumber.indexOf("+") === 0;
        // Removing non-chars
        normalizedPhoneNumber = normalizedPhoneNumber.replace(/[\.\s]/gi, "");
        if(formatInternational) {
            normalizedPhoneNumber = `0${normalizedPhoneNumber.substring(normalizedPhoneNumber.length - 9, normalizedPhoneNumber.length)}`
        }

        normalizedPhoneNumber = [
            normalizedPhoneNumber[0], normalizedPhoneNumber[1], " ",
            normalizedPhoneNumber[2], normalizedPhoneNumber[3], " ",
            normalizedPhoneNumber[4], normalizedPhoneNumber[5], " ",
            normalizedPhoneNumber[6], normalizedPhoneNumber[7], " ",
            normalizedPhoneNumber[8], normalizedPhoneNumber[9]
        ].join("");

        return normalizedPhoneNumber;
    }

    // FIXME move to router
    public static toReadableURLPathValue(value: string) {
        return value.toLowerCase()
            .replace(/[-\s']/gi, "_")
            .replace(/[èéëêêéè]/gi, "e")
            .replace(/[áàâäãåâà]/gi, "a")
            .replace(/[çç]/gi, "c")
            .replace(/[íìîï]/gi, "i")
            .replace(/[ñ]/gi, "n")
            .replace(/[óòôöõô]/gi, "o")
            .replace(/[úùûüûù]/gi, "u")
            .replace(/[œ]/gi, "oe");
    }

    public static toFullTextSearchableString(value: string) {
        // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
        // function here, than the one used in communes-import.ts tooling
        // Hence its extraction into a reusable/shareable mjs file
        return value.toLowerCase().trim()
            .replace(/[-\s']/gi, "_")
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
