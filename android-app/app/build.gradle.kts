plugins {
    id("com.android.application")
}

android {
    namespace = "com.harleytg.forum"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.harleytg.forum"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0-stage1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

val copyHtgIcon by tasks.registering(Copy::class) {
    from(rootProject.file("../assets/logos/htg-icon.png"))
    into(layout.projectDirectory.dir("src/main/res/drawable"))
    rename { "htg_icon.png" }
}

tasks.named("preBuild") {
    dependsOn(copyHtgIcon)
}
