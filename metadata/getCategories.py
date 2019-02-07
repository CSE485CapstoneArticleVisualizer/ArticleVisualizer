import requests
from bs4 import BeautifulSoup

# Prepare to write to text file
f = open('categories.dsv', 'w')
f.write('categories\n')
f.write('Social Media\n')

SJR_link = 'https://www.scimagojr.com/'
SJR = requests.get('https://www.scimagojr.com/journalrank.php?')
SJR_soup = BeautifulSoup(SJR.content, 'html.parser')

SJR_categories_button = SJR_soup.find('ul', class_='dropdown-options dropdown-element')
SJR_categories_list = list(SJR_categories_button.find_all('li'))

categories = [(li.find('a').get_text(), li.find('a').get('href') + '&type=j') for li in SJR_categories_list if 'All subject areas' not in li.find('a').get_text()]
delimiter = '|'

for category in categories:
	# Get subject areas
	category_name = category[0]
	category_link = category[1]

	category_prefix = 'Social Media' + delimiter + category_name
	f.write(category_prefix + '\n')

	print 'Finding subject areas for ' + category_name
	SJR_category = requests.get('https://www.scimagojr.com/' + category_link)
	SJR_category_soup = BeautifulSoup(SJR_category.content, 'html.parser')

	SJR_subjectAreas_button = list(SJR_category_soup.find_all('ul', class_='dropdown-options dropdown-element'))[1]
	SJR_subjectAreas_list = list(SJR_subjectAreas_button.find_all('li'))

	subjectAreas = [(li.find('a').get_text(), li.find('a').get('href')) for li in SJR_subjectAreas_list if 'All subject categories' not in li.find('a').get_text()]
	for subjectArea in subjectAreas:
		# Get All journals
		subjectArea_name = subjectArea[0]
		subjectArea_link = subjectArea[1]

		subjectArea_prefix = category_prefix + delimiter + subjectArea_name
		f.write(subjectArea_prefix + '\n')

		# print 'Finding journals for ' + subjectArea_name + ':---------'
		SJR_subjectArea = requests.get('https://www.scimagojr.com/' + subjectArea_link)
		SJR_subjectArea_soup = BeautifulSoup(SJR_subjectArea.content, 'html.parser')

		while True:
			pagination_buttons = SJR_subjectArea_soup.find('div', class_='pagination_buttons')
			if pagination_buttons == None:
				break
			next_journal_table_button = list(pagination_buttons.find_all('a'))[1]
			next_journal_table_link = next_journal_table_button.get('href')
			
			journal_table = SJR_subjectArea_soup.find('tbody')
			journals = [tr.find('td', class_='tit').get_text() for tr in journal_table.find_all('tr')]
			for journal in journals:
				# print subjectArea_prefix + '.' + journal
				f.write((subjectArea_prefix + delimiter + journal + '\n').encode('utf-8'))
				# print journal
			
			if 'disabled' in next_journal_table_button.get('class'):
				break
			SJR_subjectArea = requests.get('https://www.scimagojr.com/' + next_journal_table_link)
			SJR_subjectArea_soup = BeautifulSoup(SJR_subjectArea.content, 'html.parser')

f.close()