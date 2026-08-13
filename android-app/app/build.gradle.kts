plugins {
    id("com.android.application")
}

android {
    namespace = "com.harleytg.forum"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.harleytg.hcf14"
        minSdk = 26
        targetSdk = 37
        versionCode = 2
        versionName = "0.2.0-android14-test"
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
