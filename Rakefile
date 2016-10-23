OUT_DIR = 'gnushogi-1.4.2/gnushogi'

rule '.js' => '.coffee' do |t|
  sh "coffee -cm #{t.source}"
end

task :default => 'pre.js' do
  sh "cp pre.js hooklib.js #{OUT_DIR}"
  sh "cp Rakefile.emcc #{OUT_DIR}/Rakefile"
  sh "cd #{OUT_DIR} && rake"
  sh "cp #{OUT_DIR}/gnushogi.js #{OUT_DIR}/gnushogi.js.mem public"
end
