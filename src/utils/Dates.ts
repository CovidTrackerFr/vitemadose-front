import {Strings} from "./Strings";

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

export type WeekDay = "lundi"|"mardi"|"mercredi"|"jeudi"|"vendredi"|"samedi"|"dimanche";
export const WEEK_DAYS_DESCRIPTORS: { [k in WeekDay]: { index: number, shortName: string } } = {
    "lundi": { index: 0, shortName: "Lu" },
    "mardi": { index: 1, shortName: "Ma" },
    "mercredi": { index: 2, shortName: "Me" },
    "jeudi": { index: 3, shortName: "Je" },
    "vendredi": { index: 4, shortName: "Ve" },
    "samedi": { index: 5, shortName: "Sa" },
    "dimanche": { index: 6, shortName: "Di" },
};
export const WEEK_DAYS: WeekDay[] = Object.entries(WEEK_DAYS_DESCRIPTORS).reduce((weekdays, [weekday, desc]) => {
    weekdays[desc.index] = weekday as WeekDay;
    return weekdays;
}, Array(7).fill(null) as WeekDay[])

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
            à ${Strings.padLeft(date.getHours(), 2, '0')}:${Strings.padLeft(date.getMinutes(), 2, '0')}
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

    private static showValue(value: number, unit: string, pluralForm: string = 's', skipPlural: boolean = false) {
        return (value === 0?'':value+unit+(skipPlural?'':Strings.plural(value, pluralForm)));
    }

    public static formatDuration(durationFromNow: Duration): string {
        if (durationFromNow.totalMinutes === 0) {
            return 'quelques instants';
        } else if(durationFromNow.totalHours === 0) {
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
