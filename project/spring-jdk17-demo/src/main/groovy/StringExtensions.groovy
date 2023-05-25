class StringExtensions {
    static boolean startsWithIgnoreCase(String str, String prefix) {
        str.toLowerCase().startsWith(prefix.toLowerCase())
    }
}
