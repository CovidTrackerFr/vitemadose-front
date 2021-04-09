export type ISODateString = string;

const FR_WEEK_DAYS: Record<number,string> = {
    0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
    4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi'
};
const FR_MONTHES: Record<number, string> = {
    0: 'Janvier', 1: 'Février', 2: 'Mars', 3: 'Avril', 4: 'Mai', 5: 'Juin',
    6: 'Juillet', 7: 'Août', 8: 'Septembre', 9: 'Octobre', 10: 'Novembre', 11: 'Décembre',
};

export type Duration = {
    days: number;
    totalHours: number;
    hours: number;
    totalMinutes: number;
    minutes: number;
    totalSeconds: number;
    seconds: number;
    totalMillis: number;
    millis: number;
};

// TODO: Replace this with Luxon or momentjs once the requirements are evolving
// At the moment, no need to embed a multi Kb lib just for this
export class Dates {
    private static padLeft(value: number, size: number, filler: string) {
        const padSize = (""+value).length - size;
        let pad = '';
        for(var i=0; i<padSize; i += filler.length) { pad += filler; }
        return pad+value;
    }
    private static showValue(value: number, unit: string, skipPlural: boolean = false) {
        return (value === 0?'':value+unit+((!skipPlural && value>1)?'s':''));
    }

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
            à ${Dates.padLeft(date.getHours(), 2, '0')}:${Dates.padLeft(date.getMinutes(), 2, '0')}
        `;
    }

    public static isoToFRDatetime(isoDateStr: ISODateString|null|undefined): string|undefined {
        const date = Dates.parseISO(isoDateStr);
        return date?Dates.formatToFRDateTime(date):undefined;
    }

    public static formatDurationFromNow(isoDate: ISODateString) {
        const date = this.parseISO(isoDate);
        const durationFromNow = date?Dates.durationFromNow(date):undefined;
        return durationFromNow?Dates.formatDuration(durationFromNow):undefined;
    }

    public static durationFromNow(date: Date) {
        return Dates.durationBetween(date, new Date());
    }

    public static durationBetween(date1: Date, date2: Date) {
        const totalMillis = Math.abs(date1.getTime() - date2.getTime());
        const millis = totalMillis % 1000;
        const totalSeconds = (totalMillis - millis)/(1000);
        const seconds = ((totalMillis - millis)/1000)%60;
        const totalMinutes = (totalMillis - millis - seconds*1000)/(60*1000)
        const minutes = ((totalMillis - millis - seconds*1000)/(60*1000))%60;
        const totalHours = (totalMillis - millis - seconds*1000 - minutes*60*1000)/(60*60*1000)
        const hours = ((totalMillis - millis - seconds*1000 - minutes*60*1000)/(60*60*1000))%24;
        const days = ((totalMillis - millis - seconds*1000 - minutes*60*1000 - hours*60*60*1000)/(24*60*60*1000));
        return { days, totalHours, hours, totalMinutes, minutes, totalSeconds, seconds, totalMillis, millis };
    }

    public static formatDuration(durationFromNow: Duration): string {
        if(durationFromNow.totalHours === 0) {
            return `${Dates.showValue(durationFromNow.minutes, ' minute')}`;
        } else if(durationFromNow.totalHours <= 6) {
            return `${Dates.showValue(durationFromNow.hours, ' heure')} ${Dates.showValue(durationFromNow.minutes, ' minute')}`;
        } else if(durationFromNow.days === 0) {
            return `${Dates.showValue(durationFromNow.hours, ' heure')}`;
        } else if(durationFromNow.days < 3) {
            return `${Dates.showValue(durationFromNow.days, ' jour')} ${Dates.showValue(durationFromNow.hours, ' heure')}`;
        } else {
            return `${Dates.showValue(durationFromNow.days, ' jour')}`;
        }
    }
}
