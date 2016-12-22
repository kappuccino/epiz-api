module.exports = function(grunt){

	grunt.initConfig({
		
		watch: {
			js: {
				files: ['client/**/*.js'],
				tasks: ['exec:webpack_build']
			},
			css: {
				options:{livereload: true},
				files:['src/**/*.css']
			}
		},

		exec: {
			webpack_build: {
				command: 'npm run build',
				stdout: true,
				stderr: true
			},

			webpack_build_prod: {
				command: 'npm run build:prod',
				stdout: true,
				stderr: true
			}
		}

	})

	grunt.loadNpmTasks('grunt-contrib-watch')
	grunt.loadNpmTasks('grunt-exec')


//--


}