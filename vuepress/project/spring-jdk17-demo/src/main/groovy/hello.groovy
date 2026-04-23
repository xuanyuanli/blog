@WithLogging
def greet() {
    println "Hello World"
}
greet()

use(StringExtensions) {
    def text = "Hello, world!"
    println text.startsWithIgnoreCase("hello")
}



