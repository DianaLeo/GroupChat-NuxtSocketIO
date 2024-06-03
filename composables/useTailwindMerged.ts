import { twMerge } from "tailwind-merge"
import type { ComputedRef, MaybeRefOrGetter } from "vue"

type ClassNameValue = ClassNameValue[] | string | null | undefined | 0 | false

export function useTailwindMerged(
    ...classLists: MaybeRefOrGetter<ClassNameValue>[]
): ComputedRef<string> {
    return computed(() =>
        twMerge(
            classLists.map((maybeRefOrGetter) => toValue(maybeRefOrGetter)),
        ),
    )
}
