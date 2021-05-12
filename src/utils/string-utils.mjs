
export const toReadableURLPathValue = function(value) {
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
};

export const toFullTextSearchableString = function(value) {
    // /!\ important note : this is important to have the same implementation of toFullTextSearchableString()
    // function here, than the one used in communes-import.mjs tooling
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
};
