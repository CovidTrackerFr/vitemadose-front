


export class ArrayBuilder<T> {
    constructor(private array: T[]) {
    }

    concat(array: T[]) {
        this.array = this.array.concat(array);
        return this;
    }

    map<R>(mapper: (start: T, index?: number, array?: T[]) => R) {
        return new ArrayBuilder<R>(this.array.map(mapper));
    }

    filter(predicate: (v: T, index: number) => boolean) {
        this.array = this.array.filter(predicate);
        return this;
    }

    sort(comparator: (v1: T, v2: T) => number) {
        this.array.sort(comparator);
        return this;
    }

    sortBy(sortableDataExtractor: (v: T) => string) {
        return this.sort((v1: T, v2: T) => sortableDataExtractor(v1).localeCompare(sortableDataExtractor(v2)));
    }

    build() {
        return this.array;
    }

    public static from<T>(array: T[]) {
        return new ArrayBuilder<T>(array);
    }
}
