export type ISODateString = string;

const FR_WEEK_DAYS: Record<number,string> = {
    0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
    4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi'
};
const FR_MONTHES: Record<number, string> = {
    0: 'Janvier', 1: 'Février', 2: 'Mars', 3: 'Avril', 4: 'Mai', 5: 'Juin',
    6: 'Juillet', 7: 'Août', 8: 'Septembre', 9: 'Octobre', 10: 'Novembre', 11: 'Décembre',
};

// TODO: Replace this with Luxon or momentjs once the requirements are evolving
// At the moment, no need to embed a multi Kb lib just for this
export class Dates {
    public static parseISO(isoDateStr: ISODateString|null|undefined): Date|undefined {
        if(!isoDateStr) {
            return undefined;
        }

        const ts = Date.parse(isoDateStr);
        return (isNaN(ts))?undefined:new Date(ts);
    }

    public static formatToFRDateTime(date: Date) {
        return `
            ${FR_WEEK_DAYS[date.getDay()]} ${date.getDate()} ${FR_MONTHES[date.getMonth()]}
            à ${date.getHours()<10?'0'+date.getHours():date.getHours()}:${date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes()}
        `;
    }

    public static isoToFRDatetime(isoDateStr: ISODateString|null|undefined): string|undefined {
        const date = Dates.parseISO(isoDateStr);
        return date?Dates.formatToFRDateTime(date):undefined;
    }
}
